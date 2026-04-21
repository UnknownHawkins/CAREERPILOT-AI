import express, { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { createSubscriptionValidator } from '../utils/validators';

const router = Router();

// Public webhook route
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(SubscriptionController.handleWebhook)
);

router.use(authenticate);

router.get('/plans', asyncHandler(SubscriptionController.getPricingPlans));
router.get('/', asyncHandler(SubscriptionController.getSubscription));

router.post(
  '/',
  createSubscriptionValidator,
  asyncHandler(SubscriptionController.createSubscription)
);

router.post('/cancel', asyncHandler(SubscriptionController.cancelSubscription));
router.get('/features/:feature', asyncHandler(SubscriptionController.checkFeatureAccess));
router.get('/features', asyncHandler(SubscriptionController.getAllFeatures));
router.get('/billing/history', asyncHandler(SubscriptionController.getBillingHistory));
router.post('/mock-upgrade', asyncHandler(SubscriptionController.mockUpgrade));
router.post('/checkout', asyncHandler(SubscriptionController.createCheckoutSession));
router.post('/earn-credit', asyncHandler(SubscriptionController.earnAdCredit));
router.get('/credits', asyncHandler(SubscriptionController.getCredits));

export default router;
