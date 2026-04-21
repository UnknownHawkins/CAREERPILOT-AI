import { ResumeAnalysis, IResumeAnalysis } from '../models/Resume';
import { User } from '../models/User';
import { GroqService, ResumeAnalysisResult } from './groqService';
import { parseResume, cleanExtractedText } from '../utils/fileParser';
import { uploadFileToFirebase } from '../config/firebase';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiResponse';

export class ResumeService {
  // Upload and analyze resume
  static async uploadAndAnalyze(
    userId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    fileType: string,
    mimetype: string,
    targetRole?: string,
    industry?: string
  ): Promise<IResumeAnalysis> {
    try {
      // Check user limits
      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      if (!user.canUseResumeAnalysis()) {
        throw ApiError.forbidden('Resume analysis limit reached. Upgrade to Pro for unlimited analyses.');
      }

      // Parse resume text
      const extractedText = await parseResume(fileBuffer, fileType);
      const cleanedText = cleanExtractedText(extractedText);

      // Skip length check for images (vision analysis handles it) and emails (might be short)
      if (fileType !== 'image' && fileType !== 'email' && cleanedText.length < 100) {
        throw ApiError.badRequest('Could not extract sufficient text from the resume. Please check the file.');
      }

      let fileUrl = '';
      try {
        fileUrl = await uploadFileToFirebase(
          fileBuffer,
          originalFileName,
          fileType === 'pdf' ? 'application/pdf' : 
          fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
          fileType === 'image' ? (mimetype || 'image/jpeg') : 'text/plain',
          'resumes'
        );
      } catch (err: any) {
        logger.warn('Firebase upload failed, storing file only in MongoDB:', err.message);
      }

      // Analyze with Groq
      const analysisResult = await GroqService.analyzeResume(
        fileType === 'image' ? 'Analyze this resume image.' : cleanedText,
        targetRole,
        industry,
        fileType === 'image' ? {
          buffer: fileBuffer,
          mimeType: mimetype
        } : undefined
      );

      // Save analysis to database
      const resumeAnalysis = new ResumeAnalysis({
        userId,
        originalFileName,
        fileUrl,
        fileData: fileBuffer,
        fileType: fileType as any,
        extractedText: fileType === 'image' ? 'IMAGE_CONTENT' : cleanedText,
        atsScore: analysisResult.atsScore,
        analysis: {
          overallFeedback: analysisResult.overallFeedback,
          strengths: analysisResult.strengths,
          weaknesses: analysisResult.weaknesses,
          sections: analysisResult.sections,
          keywordOptimization: analysisResult.keywordOptimization,
          formatting: analysisResult.formatting,
        },
        skillGapAnalysis: analysisResult.skillGapAnalysis,
        improvementSuggestions: analysisResult.improvementSuggestions,
        jobSuggestions: analysisResult.jobSuggestions,
        matchingRoles: analysisResult.matchingRoles,
      });

      await resumeAnalysis.save();

      // Increment user usage
      user.usage.resumeAnalysisCount += 1;
      await user.save();

      logger.info(`Resume analyzed for user ${userId}. ATS Score: ${analysisResult.atsScore}`);
      
      // Log Activity
      try {
        const { ActivityService } = await import('./activityService');
        await ActivityService.logActivity(
          userId,
          'resume',
          'Resume analyzed',
          `ATS Score: ${analysisResult.atsScore}%`,
          `/resume/${resumeAnalysis._id}`,
          { score: analysisResult.atsScore }
        );
      } catch (actError) {
        logger.warn('Failed to log resume activity:', actError);
      }

      // Dual write to Firebase Firestore
      try {
        const { getFirestore } = await import('../config/firebase');
        const db = getFirestore();
        const firestoreData = resumeAnalysis.toObject();
        delete firestoreData.fileData; // Do not sync large binary buffer over 1MB Firestore limit, fileUrl exists as backup!
        await db.collection('analyses').doc(resumeAnalysis._id.toString()).set({
          ...firestoreData,
          userId: userId.toString() // Ensure userId is string natively in Firestore
        });
        logger.info(`Resume analysis ${resumeAnalysis._id} mirrored to Firebase Firestore.`);
      } catch (fbError: any) {
        logger.warn(`Failed to mirror analysis ${resumeAnalysis._id} to Firebase: ${fbError.message}`);
      }

      return resumeAnalysis;
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        logger.error(`Resume validation failed: ${messages.join(', ')}`);
        throw ApiError.badRequest(`Validation failed: ${messages.join(', ')}`);
      }
      logger.error('Resume upload and analysis error:', error);
      throw error;
    }
  }

  // Get user's resume analyses
  static async getUserAnalyses(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ analyses: IResumeAnalysis[]; total: number }> {
    try {
      let analyses: IResumeAnalysis[] = [];
      let total: number = 0;
      const skip = (page - 1) * limit;

      try {
        [analyses, total] = await Promise.all([
          ResumeAnalysis.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-extractedText -fileData')
            .exec(),
          ResumeAnalysis.countDocuments({ userId }),
        ]);
      } catch (mongoError: any) {
        logger.warn(`MongoDB failed for getUserAnalyses: ${mongoError.message}, attempting Firebase fallback`);
        // Fallback to Firebase
        try {
          const { getFirestore } = await import('../config/firebase');
          const db = getFirestore();
          const snapshot = await db.collection('analyses')
            .where('userId', '==', userId.toString())
            .orderBy('createdAt', 'desc')
            .offset(skip)
            .limit(limit)
            .get();

          const countSnapshot = await db.collection('analyses').where('userId', '==', userId.toString()).count().get();
          total = countSnapshot.data().count;

          analyses = snapshot.docs.map(doc => {
             const fakeDoc = new ResumeAnalysis(doc.data());
             fakeDoc._id = doc.id as any;
             return fakeDoc;
          });
          logger.info(`Successfully fetched ${analyses.length} analyses from Firebase fallback.`);
        } catch (fbError: any) {
           logger.error(`Firebase fallback failed for getUserAnalyses: ${fbError.message}`);
           throw new Error('Databases are completely unavailable');
        }
      }

      return { analyses, total };
    } catch (error) {
      logger.error('Get user analyses error:', error);
      throw error;
    }
  }

  // Get single analysis
  static async getAnalysisById(
    analysisId: string,
    userId: string
  ): Promise<IResumeAnalysis> {
    try {
      let analysis: any = null;
      try {
        analysis = await ResumeAnalysis.findOne({
          _id: analysisId,
          userId,
        });
      } catch (mongoError: any) {
        logger.warn(`MongoDB lookup failed for getAnalysisById, fallback Firebase: ${mongoError.message}`);
      }

      if (!analysis) {
        try {
          const { getFirestore } = await import('../config/firebase');
          const db = getFirestore();
          const doc = await db.collection('analyses').doc(analysisId).get();
          if (doc.exists && doc.data()?.userId === userId.toString()) {
            analysis = new ResumeAnalysis(doc.data());
            analysis._id = doc.id as any;
            logger.info(`Successfully fetched analysis ${analysisId} from Firebase fallback.`);
          }
        } catch (fbError: any) {
           logger.warn(`Firebase fallback failed for getAnalysisById: ${fbError.message}`);
        }
      }

      if (!analysis) {
        throw ApiError.notFound('Analysis not found');
      }

      return analysis;
    } catch (error) {
      logger.error('Get analysis by ID error:', error);
      throw error;
    }
  }

  // Delete analysis
  static async deleteAnalysis(
    analysisId: string,
    userId: string
  ): Promise<void> {
    try {
      const analysis = await ResumeAnalysis.findOneAndDelete({
        _id: analysisId,
        userId,
      });

      if (!analysis) {
        throw ApiError.notFound('Analysis not found');
      }

      // Delete file from Firebase
      if (analysis.fileUrl) {
        try {
          const { deleteFileFromFirebase } = await import('../config/firebase');
          await deleteFileFromFirebase(analysis.fileUrl);
        } catch (firebaseError) {
          logger.warn('Failed to delete file from Firebase:', firebaseError);
        }
      }

      logger.info(`Analysis ${analysisId} deleted for user ${userId}`);
    } catch (error) {
      logger.error('Delete analysis error:', error);
      throw error;
    }
  }

  // Get analysis statistics
  static async getAnalysisStats(userId: string): Promise<{
    totalAnalyses: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    recentAnalyses: IResumeAnalysis[];
  }> {
    try {
      const analyses = await ResumeAnalysis.find({ userId })
        .sort({ createdAt: -1 })
        .select('atsScore createdAt originalFileName')
        .exec();

      if (analyses.length === 0) {
        return {
          totalAnalyses: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          recentAnalyses: [],
        };
      }

      const scores = analyses.map(a => a.atsScore);
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      return {
        totalAnalyses: analyses.length,
        averageScore: Math.round(averageScore),
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        recentAnalyses: analyses.slice(0, 5),
      };
    } catch (error) {
      logger.error('Get analysis stats error:', error);
      throw error;
    }
  }

  // Reanalyze existing resume
  static async reanalyzeResume(
    analysisId: string,
    userId: string,
    targetRole?: string,
    industry?: string
  ): Promise<IResumeAnalysis> {
    try {
      const existingAnalysis = await ResumeAnalysis.findOne({
        _id: analysisId,
        userId,
      });

      if (!existingAnalysis) {
        throw ApiError.notFound('Analysis not found');
      }

      // Check user limits
      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      if (!user.canUseResumeAnalysis()) {
        throw ApiError.forbidden('Resume analysis limit reached. Upgrade to Pro for unlimited analyses.');
      }

      // Reanalyze with new parameters
      const analysisResult = await GroqService.analyzeResume(
        existingAnalysis.extractedText,
        targetRole,
        industry
      );

      // Update analysis
      existingAnalysis.atsScore = analysisResult.atsScore;
      existingAnalysis.analysis = {
        overallFeedback: analysisResult.overallFeedback,
        strengths: analysisResult.strengths,
        weaknesses: analysisResult.weaknesses,
        sections: analysisResult.sections,
        keywordOptimization: analysisResult.keywordOptimization,
        formatting: analysisResult.formatting,
      };
      existingAnalysis.skillGapAnalysis = analysisResult.skillGapAnalysis;
      existingAnalysis.improvementSuggestions = analysisResult.improvementSuggestions;
      existingAnalysis.jobSuggestions = analysisResult.jobSuggestions;
      existingAnalysis.matchingRoles = analysisResult.matchingRoles;

      await existingAnalysis.save();

      // Increment usage for free users
      if (!user.hasProAccess()) {
        user.usage.resumeAnalysisCount += 1;
        await user.save();
      }

      logger.info(`Resume reanalyzed for user ${userId}. New ATS Score: ${analysisResult.atsScore}`);

      return existingAnalysis;
    } catch (error) {
      logger.error('Reanalyze resume error:', error);
      throw error;
    }
  }
}
