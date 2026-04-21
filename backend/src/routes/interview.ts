import { Router } from 'express';
import { InterviewController } from '../controllers/interviewController';
import { authenticate, requirePro } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  createInterviewValidator,
  answerQuestionValidator,
  paginationValidator,
  idParamValidator,
} from '../utils/validators';
import { audioUpload, handleUploadError } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create interview session
router.post(
  '/',
  aiRateLimiter,
  createInterviewValidator,
  asyncHandler(InterviewController.createSession)
);

// Transcribe audio answer
router.post(
  '/transcribe',
  aiRateLimiter,
  audioUpload.single('audio'),
  handleUploadError,
  asyncHandler(InterviewController.transcribe)
);

// Get user's sessions
router.get('/', paginationValidator, asyncHandler(InterviewController.getUserSessions));

// Get interview statistics
router.get('/stats', asyncHandler(InterviewController.getInterviewStats));

// Get interview tips
router.get('/tips', asyncHandler(InterviewController.getInterviewTips));

// Get session by ID
router.get('/:id', idParamValidator, asyncHandler(InterviewController.getSessionById));

// Submit answer
router.post(
  '/:id/answer',
  idParamValidator,
  answerQuestionValidator,
  asyncHandler(InterviewController.submitAnswer)
);

// Complete session
router.post('/:id/complete', idParamValidator, asyncHandler(InterviewController.completeSession));

// Abandon session
router.post('/:id/abandon', idParamValidator, asyncHandler(InterviewController.abandonSession));

// Delete session
router.delete('/:id', idParamValidator, asyncHandler(InterviewController.deleteSession));

export default router;
