import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
} from '../utils/validators';

const router = Router();

// Public routes
router.post('/register', registerValidator, asyncHandler(AuthController.register));
router.post('/login', authRateLimiter, loginValidator, asyncHandler(AuthController.login));
router.post('/refresh-token', asyncHandler(AuthController.refreshToken));
router.post('/forgot-password', asyncHandler(AuthController.forgotPassword));

// Protected routes
router.use(authenticate);

router.get('/me', asyncHandler(AuthController.getCurrentUser));
router.put('/profile', updateProfileValidator, asyncHandler(AuthController.updateProfile));
router.put('/change-password', asyncHandler(AuthController.changePassword));
router.post('/logout', asyncHandler(AuthController.logout));
router.get('/stats', asyncHandler(AuthController.getUserStats));

export default router;
