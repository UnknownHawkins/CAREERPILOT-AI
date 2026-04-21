import { Router } from 'express';
import { LinkedInController } from '../controllers/linkedinController';
import { authenticate } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';
import { linkedInReviewValidator } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Analyze full profile
router.post(
  '/analyze',
  aiRateLimiter,
  linkedInReviewValidator,
  asyncHandler(LinkedInController.analyzeProfile)
);

// Analyze headline only
router.post('/analyze/headline', aiRateLimiter, asyncHandler(LinkedInController.analyzeHeadline));

// Analyze summary only
router.post('/analyze/summary', aiRateLimiter, asyncHandler(LinkedInController.analyzeSummary));

// Generate headline suggestions
router.post(
  '/suggestions/headline',
  aiRateLimiter,
  asyncHandler(LinkedInController.generateHeadlineSuggestions)
);

// Generate optimized summary
router.post('/generate/summary', aiRateLimiter, asyncHandler(LinkedInController.generateSummary));

// Optimize skills
router.post('/optimize/skills', aiRateLimiter, asyncHandler(LinkedInController.optimizeSkills));

// Calculate profile completion
router.post('/completion', asyncHandler(LinkedInController.calculateProfileCompletion));

// Get optimization checklist
router.get('/checklist', asyncHandler(LinkedInController.getOptimizationChecklist));

export default router;
