'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import { authApi } from '@/lib/api';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';
  const { refreshUser } = useAuthStore();
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    // Re-fetch the user from the server so the role/plan is up to date
    refreshUser().finally(() => setSyncing(false));
  }, []);

  const planLabel = plan === 'enterprise' ? 'Enterprise' : 'Pro';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[140px] rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md text-center space-y-8"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 14 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </motion.div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground text-lg">
            Welcome to <span className="text-primary font-semibold">{planLabel}</span>. Your account
            has been upgraded and all features are now unlocked.
          </p>
        </div>

        {/* Feature callout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left space-y-2"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="w-4 h-4" />
            Now available on your account
          </div>
          {plan === 'enterprise' ? (
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unlimited everything from Pro</li>
              <li>• Team management & SSO</li>
              <li>• Dedicated success manager</li>
              <li>• Custom API integration</li>
            </ul>
          ) : (
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unlimited resume analyses</li>
              <li>• Unlimited mock interviews</li>
              <li>• Advanced AI models (Llama 3.3 70B)</li>
              <li>• Priority support</li>
            </ul>
          )}
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="gap-2"
            onClick={() => router.push('/dashboard')}
            disabled={syncing}
          >
            {syncing ? 'Syncing account…' : 'Go to Dashboard'}
            {!syncing && <ArrowRight className="w-4 h-4" />}
          </Button>
          <Button variant="outline" onClick={() => router.push('/settings?tab=billing')}>
            View Billing
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
