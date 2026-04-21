import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import { constructStripeEvent, createStripeCheckoutSession, createStripeCustomer, getStripeClient } from '../config/stripe';
import { successResponse, ApiError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { User } from '../models/User';

export class SubscriptionController {
  // Create subscription
  static async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { plan, billingCycle = 'monthly' } = req.body;

      if (!plan || !['pro', 'enterprise'].includes(plan)) {
        throw ApiError.badRequest('Valid plan is required (pro or enterprise)');
      }

      const result = await SubscriptionService.createSubscription(
        userId,
        plan,
        billingCycle
      );

      successResponse(
        res,
        result,
        'Subscription created successfully',
        201
      );
    } catch (error) {
      logger.error('Create subscription error:', error);
      throw error;
    }
  }

  // Get subscription details
  static async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();

      const details = await SubscriptionService.getSubscriptionDetails(userId);

      successResponse(res, details);
    } catch (error) {
      logger.error('Get subscription error:', error);
      throw error;
    }
  }

  // Cancel subscription
  static async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { reason, feedback } = req.body;

      const subscription = await SubscriptionService.cancelSubscription(
        userId,
        reason,
        feedback
      );

      successResponse(res, subscription, 'Subscription cancelled successfully');
    } catch (error) {
      logger.error('Cancel subscription error:', error);
      throw error;
    }
  }

  // Check feature access
  static async checkFeatureAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { feature } = req.params;

      const access = await SubscriptionService.checkFeatureAccess(userId, feature);

      successResponse(res, access);
    } catch (error) {
      logger.error('Check feature access error:', error);
      throw error;
    }
  }

  // Get all features
  static async getAllFeatures(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();

      const features = [
        'resumeAnalysis',
        'interviews',
        'jobMatches',
        'roadmaps',
        'linkedInReview',
        'apiAccess',
      ];

      const accessMap: Record<string, any> = {};

      for (const feature of features) {
        accessMap[feature] = await SubscriptionService.checkFeatureAccess(
          userId,
          feature
        );
      }

      successResponse(res, accessMap);
    } catch (error) {
      logger.error('Get all features error:', error);
      throw error;
    }
  }

  // Handle Stripe webhook
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        throw ApiError.badRequest('Stripe signature is required');
      }

      const event = constructStripeEvent(req.body, signature);

      await SubscriptionService.handleWebhookEvent(event);

      successResponse(res, null, 'Webhook handled successfully');
    } catch (error) {
      logger.error('Webhook handling error:', error);
      throw error;
    }
  }

  // Get pricing plans
  static async getPricingPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = {
        free: {
          name: 'Free',
          price: { monthly: 0, yearly: 0 },
          features: {
            resumeAnalysis: { limit: 2, period: 'month' },
            interviews: { limit: 2, period: 'month' },
            jobMatches: { limit: 2, period: 'month' },
            roadmaps: { limit: 'unlimited', period: 'total' },
            linkedInReview: { limit: 2, period: 'month' },
            apiAccess: false,
            prioritySupport: false,
          },
        },
        pro: {
          name: 'Pro',
          price: { monthly: 9, yearly: 90 },
          features: {
            resumeAnalysis: { limit: 'unlimited', period: 'month' },
            interviews: { limit: 'unlimited', period: 'month' },
            jobMatches: { limit: 'unlimited', period: 'month' },
            roadmaps: { limit: 'unlimited', period: 'total' },
            linkedInReview: { limit: 'unlimited', period: 'month' },
            apiAccess: { limit: 1000, period: 'month' },
            prioritySupport: true,
          },
        },
        enterprise: {
          name: 'Enterprise',
          price: { monthly: 29, yearly: 290 },
          features: {
            resumeAnalysis: { limit: 'unlimited', period: 'month' },
            interviews: { limit: 'unlimited', period: 'month' },
            jobMatches: { limit: 'unlimited', period: 'week' },
            roadmaps: { limit: 10, period: 'total' },
            linkedInReview: { limit: 'unlimited', period: 'month' },
            apiAccess: { limit: 10000, period: 'month' },
            prioritySupport: true,
            customBranding: true,
          },
        },
      };

      successResponse(res, plans);
    } catch (error) {
      logger.error('Get pricing plans error:', error);
      throw error;
    }
  }

  // Get billing history (placeholder)
  static async getBillingHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();

      // This would typically fetch from Stripe
      // For now, return placeholder
      const billingHistory = [
        {
          id: 'inv_1',
          date: new Date(),
          amount: 2900,
          currency: 'USD',
          status: 'paid',
          description: 'Pro Plan - Monthly',
        },
      ];

      successResponse(res, billingHistory);
    } catch (error) {
      logger.error('Get billing history error:', error);
      throw error;
    }
  }

  // Mock upgrade (for testing when Stripe is not configured)
  static async mockUpgrade(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { plan = 'pro' } = req.body;

      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('User not found');

      user.role = plan as any;
      user.subscription = {
        ...(user.subscription || {}),
        status: 'active',
        plan: plan as any,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      } as any;

      await user.save();

      // Return full user so frontend can update the store immediately
      const updated = await User.findById(userId).select('-password -__v');
      successResponse(res, updated, `Account successfully upgraded to ${plan}`);
    } catch (error) {
      logger.error('Mock upgrade error:', error);
      throw error;
    }
  }

  // Record a watched ad → every 2 ads earns 1 credit
  static async earnAdCredit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('User not found');

      const result = await (user as any).earnAdCredit();

      successResponse(res, {
        credited: result.credited,
        adsWatched: result.adsWatched,
        adCredits: result.totalCredits,
        message: result.credited
          ? `🎉 Credit earned! You now have ${result.totalCredits} ad credit(s).`
          : `Ad ${result.adsWatched % 2 === 1 ? 1 : 2} of 2 watched. Watch 1 more to earn a credit.`,
      }, 'Ad recorded');
    } catch (error) {
      logger.error('Earn ad credit error:', error);
      throw error;
    }
  }

  // Get current credits for the user
  static async getCredits(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const user = await User.findById(userId).select('usage role subscription');
      if (!user) throw ApiError.notFound('User not found');

      const role = user.role;
      const isPro = role === 'pro' || role === 'enterprise' || role === 'admin';

      const limits = { free: 2, pro: -1, enterprise: -1, admin: -1 };
      const monthlyLimit = limits[role as keyof typeof limits] ?? 2;

      successResponse(res, {
        role,
        isPro,
        monthlyLimit,          // -1 = unlimited
        usage: {
          resumeAnalysis: user.usage.resumeAnalysisCount,
          interviews:     user.usage.interviewSessionsCount,
          linkedin:       user.usage.linkedinReviewCount,
          jobMatch:       user.usage.jobMatchCount,
        },
        adCredits: user.usage.adCredits || 0,
        adsWatchedThisSession: user.usage.adsWatchedThisSession || 0,
      });
    } catch (error) {
      logger.error('Get credits error:', error);
      throw error;
    }
  }

  // Create Stripe Checkout session → returns hosted checkout URL
  static async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { plan = 'pro', billingCycle = 'monthly' } = req.body;

      if (!['pro', 'enterprise'].includes(plan)) {
        throw ApiError.badRequest('Valid plan required (pro or enterprise)');
      }

      // Try real Stripe first
      const priceId = process.env[`STRIPE_PRICE_ID_${plan.toUpperCase()}_${billingCycle.toUpperCase()}`];

      if (!priceId) {
        // Stripe price IDs not set — fall back to mock upgrade
        const user = await User.findById(userId);
        if (!user) throw ApiError.notFound('User not found');

        user.role = plan as any;
        user.subscription = {
          ...(user.subscription || {}),
          status: 'active',
          plan: plan as any,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        } as any;
        await user.save();

        const updated = await User.findById(userId).select('-password -__v');
        successResponse(res, { user: updated, checkoutUrl: null, mock: true }, 'Plan upgraded (mock mode — no Stripe price IDs set)');
        return;
      }

      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('User not found');

      // Ensure Stripe customer exists
      let stripeCustomerId = user.subscription?.stripeCustomerId;
      if (!stripeCustomerId) {
        const fullName = `${user.firstName} ${user.lastName}`.trim();
        const customer = await createStripeCustomer(user.email, fullName);
        stripeCustomerId = customer.id;
        user.subscription = { ...(user.subscription || {}), stripeCustomerId } as any;
        await user.save();
      }

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const session = await createStripeCheckoutSession(
        stripeCustomerId,
        priceId,
        `${clientUrl}/payment/success?plan=${plan}`,
        `${clientUrl}/pricing?cancelled=true`,
        { userId, plan, billingCycle }
      );

      successResponse(res, { checkoutUrl: session.url, sessionId: session.id, mock: false }, 'Checkout session created');
    } catch (error) {
      logger.error('Create checkout session error:', error);
      throw error;
    }
  }
}
