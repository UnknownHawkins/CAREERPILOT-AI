import { Request, Response } from 'express';
import { ActivityService } from '../services/activityService';
import { successResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class ActivityController {
  static async getUserActivities(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const limit = parseInt(req.query.limit as string) || 10;

      const activities = await ActivityService.getUserActivities(userId, limit);

      successResponse(res, activities, 'Activities retrieved successfully');
    } catch (error) {
      logger.error('Get user activities controller error:', error);
      throw error;
    }
  }
}
