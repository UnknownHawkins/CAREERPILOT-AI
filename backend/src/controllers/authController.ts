import { Request, Response } from 'express';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { generateTokens } from '../middleware/auth';
import { successResponse, errorResponse, ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw ApiError.conflict('User with this email already exists');
      }

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role: 'free',
        subscription: {
          status: 'none',
          plan: 'free',
        },
        usage: {
          resumeAnalysisCount: 0,
          interviewSessionsCount: 0,
          lastResetDate: new Date(),
        },
      });

      await user.save();

      // Create free subscription
      const subscription = new Subscription({
        userId: user._id,
        plan: 'free',
        status: 'active',
        endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years
      });
      await subscription.save();

      // Dual write to Firebase Firestore
      try {
        const { getFirestore } = await import('../config/firebase');
        const db = getFirestore();
        await db.collection('users').doc(user._id.toString()).set({
          ...user.toObject(),
          password: user.password // Ensure hash is synced for fallback logins!
        });
        logger.info(`User ${user.email} mirrored to Firebase Firestore successfully.`);
      } catch (fbError: any) {
        logger.warn(`Failed to mirror user ${user.email} to Firebase: ${fbError.message}`);
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Remove password from response
      const userResponse = user.toObject();
      delete (userResponse as any).password;

      logger.info(`New user registered: ${email}`);

      successResponse(
        res,
        {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
        'User registered successfully',
        201
      );
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      let user: any = null;
      let isFirebaseUser = false;
      let firebaseUserData: any = null;

      try {
        user = await User.findOne({ email }).select('+password');
      } catch (mongoError: any) {
        logger.warn(`MongoDB lookup failed for ${email}, attempting Firebase fallback: ${mongoError.message}`);
      }
      
      if (!user) {
        // Fallback to Firebase
        try {
          const { getFirestore } = await import('../config/firebase');
          const db = getFirestore();
          const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
          if (!snapshot.empty) {
            firebaseUserData = snapshot.docs[0].data();
            firebaseUserData._id = snapshot.docs[0].id;
            isFirebaseUser = true;
            logger.info(`Successfully fetched user ${email} from Firebase fallback.`);
          }
        } catch (fbError: any) {
          logger.warn(`Firebase fallback failed for ${email}: ${fbError.message}`);
        }

        if (!isFirebaseUser) {
          throw ApiError.unauthorized('Invalid email or password');
        }
      }

      // Check password
      let isPasswordValid = false;
      if (isFirebaseUser && firebaseUserData) {
        const bcrypt = await import('bcryptjs');
        isPasswordValid = await bcrypt.compare(password, firebaseUserData.password);
      } else if (user) {
        isPasswordValid = await user.comparePassword(password);
      }

      if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      // Update last login
      if (user) {
        user.lastLoginAt = new Date();
        await user.save();
      } else if (isFirebaseUser && firebaseUserData) {
        // Hydrate a mongoose-like object for token generation
        user = new User(firebaseUserData);
        user._id = firebaseUserData._id;
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Remove password from response
      const userResponse = user.toObject();
      delete (userResponse as any).password;

      logger.info(`User logged in: ${email}`);

      successResponse(res, {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Refresh token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw ApiError.badRequest('Refresh token is required');
      }

      // Verify refresh token
      const { verifyRefreshToken } = await import('../middleware/auth');
      const decoded = verifyRefreshToken(refreshToken);

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      successResponse(res, {
        tokens,
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw ApiError.unauthorized('Invalid refresh token');
    }
  }

  // Get current user
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      
      if (!user) {
        throw ApiError.unauthorized('Not authenticated');
      }

      // Get subscription details
      const subscription = await Subscription.findOne({ userId: user._id });

      successResponse(res, {
        user,
        subscription,
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  // Update profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id;
      const updateData = req.body;

      // Fields that can be updated
      const allowedUpdates = [
        'firstName',
        'lastName',
        'skills',
        'experience',
        'education',
        'targetRole',
        'industry',
        'yearsOfExperience',
        'preferences',
      ];

      const updates: any = {};
      allowedUpdates.forEach((field) => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      logger.info(`Profile updated for user ${userId}`);

      successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Verify current password
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        throw ApiError.badRequest('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user ${userId}`);

      successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  // Logout
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a more complex implementation, you might want to blacklist the token
      logger.info(`User logged out: ${req.user?._id}`);
      successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  // Forgot password
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists
        successResponse(res, null, 'If an account exists, a reset email will be sent');
        return;
      }

      // Generate reset token (implement your own token generation)
      // Send email with reset link
      // This is a placeholder - implement actual email sending

      logger.info(`Password reset requested for: ${email}`);

      successResponse(res, null, 'If an account exists, a reset email will be sent');
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  // Get user stats
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id;

      const [
        resumeStats,
        interviewStats,
        roadmapStats,
        jobMatchStats,
      ] = await Promise.all([
        import('../services/resumeService').then(s => s.ResumeService.getAnalysisStats(userId.toString())),
        import('../services/interviewService').then(s => s.InterviewService.getInterviewStats(userId.toString())),
        import('../services/roadmapService').then(s => s.RoadmapService.getRoadmapStats(userId.toString())),
        import('../services/jobMatchService').then(s => s.JobMatchService.getJobMatchStats(userId.toString())),
      ]);

      successResponse(res, {
        resume: resumeStats,
        interview: interviewStats,
        roadmap: roadmapStats,
        jobMatch: jobMatchStats,
      });
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw error;
    }
  }
}
