import { Router, Request, Response, NextFunction } from 'express';
import { RoadmapController } from '../controllers/roadmapController';
import { authenticate } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';
import { createRoadmapValidator, idParamValidator } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create career roadmap
router.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('Roadmap Request Body:', req.body);
    next();
  },
  asyncHandler(RoadmapController.createRoadmap)
);

// Get user's roadmaps
router.get('/', asyncHandler(RoadmapController.getUserRoadmaps));

// Get roadmap statistics
router.get('/stats', asyncHandler(RoadmapController.getRoadmapStats));

// Get upcoming milestones
router.get('/milestones/upcoming', asyncHandler(RoadmapController.getUpcomingMilestones));

// Get roadmap by ID
router.get('/:id', idParamValidator, asyncHandler(RoadmapController.getRoadmapById));

// Complete milestone
router.post(
  '/:id/milestones/:milestoneId/complete',
  idParamValidator,
  asyncHandler(RoadmapController.completeMilestone)
);

// Update roadmap status
router.put('/:id/status', idParamValidator, asyncHandler(RoadmapController.updateStatus));

// Get skill gap analysis
router.get('/:id/skill-gap', idParamValidator, asyncHandler(RoadmapController.getSkillGapAnalysis));

// Get learning resources
router.get('/:id/resources', idParamValidator, asyncHandler(RoadmapController.getLearningResources));

// Delete roadmap
router.delete('/:id', idParamValidator, asyncHandler(RoadmapController.deleteRoadmap));

export default router;