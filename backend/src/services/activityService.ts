import { Activity, IActivity } from '../models/Activity';
import { logger } from '../utils/logger';

export class ActivityService {
  static async logActivity(
    userId: string,
    type: IActivity['type'],
    title: string,
    description: string,
    link?: string,
    metadata?: any
  ): Promise<IActivity> {
    try {
      const activity = new Activity({
        userId,
        type,
        title,
        description,
        link,
        metadata,
      });
      await activity.save();
      return activity;
    } catch (error) {
      logger.error('Log activity error:', error);
      throw error;
    }
  }

  static async getUserActivities(
    userId: string,
    limit: number = 10
  ): Promise<IActivity[]> {
    try {
      return await Activity.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      logger.error('Get user activities error:', error);
      throw error;
    }
  }
}
