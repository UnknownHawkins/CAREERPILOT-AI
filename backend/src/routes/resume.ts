import { Router } from 'express';
import { ResumeController } from '../controllers/resumeController';
import { authenticate, requirePro } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { resumeUpload } from '../middleware/upload';
import { asyncHandler } from '../middleware/asyncHandler';
import { resumeUploadValidator, paginationValidator, idParamValidator } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload and analyze resume
router.post(
  '/upload',
  uploadRateLimiter,
  resumeUpload.single('resume'),
  resumeUploadValidator,
  asyncHandler(ResumeController.uploadAndAnalyze)
);

// Get user's analyses
router.get('/', paginationValidator, asyncHandler(ResumeController.getUserAnalyses));

// Get analysis statistics
router.get('/stats', asyncHandler(ResumeController.getAnalysisStats));

// Compare resumes (Pro feature)
router.post('/compare', requirePro, asyncHandler(ResumeController.compareResumes));

// Reanalyze resume
router.post('/:id/reanalyze', idParamValidator, asyncHandler(ResumeController.reanalyzeResume));

// Get analysis by ID
router.get('/:id', idParamValidator, asyncHandler(ResumeController.getAnalysisById));

// Delete analysis
router.delete('/:id', idParamValidator, asyncHandler(ResumeController.deleteAnalysis));

export default router;
