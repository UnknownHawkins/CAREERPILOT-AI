import { Router } from 'express';
import { JobMatchController } from '../controllers/jobMatchController';
import { authenticate, requirePro } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  createJobMatchValidator,
  paginationValidator,
  idParamValidator,
} from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create job match
router.post(
  '/',
  aiRateLimiter,
  createJobMatchValidator,
  asyncHandler(JobMatchController.createJobMatch)
);

// Get user's job matches
router.get('/', paginationValidator, asyncHandler(JobMatchController.getUserJobMatches));

// Get job match statistics
router.get('/stats', asyncHandler(JobMatchController.getJobMatchStats));

// Get recommended jobs (Pro feature)
router.get('/recommended', requirePro, asyncHandler(JobMatchController.getRecommendedJobs));

// Search job matches
router.get('/search', asyncHandler(JobMatchController.searchJobMatches));

// Find jobs using AI
router.post('/find', aiRateLimiter, asyncHandler(JobMatchController.findJobs));

// Bulk create job matches (Pro feature)
router.post('/bulk', requirePro, asyncHandler(JobMatchController.bulkCreateJobMatches));

// Get job match by ID
router.get('/:id', idParamValidator, asyncHandler(JobMatchController.getJobMatchById));

// Update application status
router.put('/:id/status', idParamValidator, asyncHandler(JobMatchController.updateStatus));

// Delete job match
router.delete('/:id', idParamValidator, asyncHandler(JobMatchController.deleteJobMatch));

export default router;
