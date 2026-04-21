import { Router } from 'express';
import { ActivityController } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', ActivityController.getUserActivities);

export default router;
