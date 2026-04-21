'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Shield, Crown, Rocket } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from '@/components/ui';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { subscriptionApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for exploring the platform and starting your journey.',
    features: [
      '2 Resume Analyses / Mo',
      '2 Mock Interview Sessions / Mo',
      '2 LinkedIn Profile Reviews / Mo',
      '2 Job Match Analyses / Mo',
      'Unlimited Career Roadmaps',
      'Basic AI Models',
      'Community Support',
    ],
    icon: Rocket,
    plan: null as null | 'pro' | 'enterprise',
    buttonText: 'Current Plan',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$9',
    description: 'The ultimate toolset for accelerated career growth.',
    features: [
      'Unlimited Resume Analysis',
      'Unlimited Mock Interviews',
      'Unlimited LinkedIn Reviews',
      'Unlimited Job Matching',
      'Advanced Llama 3.3 70B Models',
      'Priority Support',
      'Advanced Dashboard Analytics',
    ],
    icon: Crown,
    plan: 'pro' as const,
    buttonText: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$29',
    description: 'Custom solutions for teams and organizations.',
    features: [
      'Everything in Pro',
      'Unlimited Teams & Members',
      'Custom AI Training',
      'Dedicated Success Manager',
      'SSO & Advanced Security',
      'Custom API Integration',
      'SLA Guarantees',
    ],
    icon: Shield,
    plan: 'enterprise' as const,
    buttonText: 'Get Enterprise',
    popular: false,
  },
];

export default function PricingPage() {
  const { user, setUser, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const currentPlan =
    user?.role === 'pro' ? 'Pro'
    : user?.role === 'enterprise' ? 'Enterprise'
    : user?.role === 'admin' ? 'Admin'
    : 'Free';

  const handleUpgrade = async (tier: typeof tiers[number]) => {
    if (!tier.plan) return;

    setLoading(tier.name);
    try {
      const res: any = await subscriptionApi.mockUpgrade(tier.plan);
      setUser(res.data);

      toast.success(
        `🎉 Level Up! You're now on the ${tier.name} plan.`,
        'Your new features are ready to use.'
      );
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(
        'Upgrade Failed',
        error.response?.data?.message || 'We could not process your upgrade. Please try again.'
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative pt-8 pb-16">
        {/* Background gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-blue-500/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-500/10 blur-[120px] rounded-full -z-10" />

        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="px-4 py-1 border-blue-500/50 text-blue-600 bg-blue-50/50 mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade Your Career
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-4">
              Choose the plan that fits your career goals. Upgrade instantly — cancel anytime.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => {
            const isCurrent = currentPlan === tier.name && user?.subscription?.status === 'active';
            const isDowngrade = user?.subscription?.status === 'active' && (
              (currentPlan === 'Pro' && tier.name === 'Free') ||
              (currentPlan === 'Enterprise' && (tier.name === 'Free' || tier.name === 'Pro')));
            const Icon = tier.icon;

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    'relative h-full flex flex-col transition-all duration-300 border-2',
                    tier.popular
                      ? 'border-primary shadow-xl shadow-primary/10 scale-105 z-10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg">
                        MOST POPULAR
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn('p-2 rounded-xl', tier.popular ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      {tier.price !== '$0' && <span className="text-muted-foreground">/mo</span>}
                    </div>
                    <CardDescription className="min-h-[48px] mt-2">{tier.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        What's Included:
                      </p>
                      <ul className="space-y-3">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-sm">
                            <div className="mt-0.5 p-0.5 rounded-full bg-green-500/10 text-green-600">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-6">
                    <Button
                      className="w-full h-11 text-base font-semibold transition-all duration-300"
                      variant={isCurrent ? 'outline' : tier.popular ? 'default' : 'outline'}
                      disabled={isCurrent || isDowngrade || loading !== null || !tier.plan}
                      onClick={() => handleUpgrade(tier)}
                    >
                      {loading === tier.name ? (
                        <Zap className="w-5 h-5 animate-pulse" />
                      ) : isCurrent ? (
                        '✓ Active Plan'
                      ) : isDowngrade ? (
                        'Current or Lower Tier'
                      ) : (
                        tier.buttonText
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-24 text-center">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Secure payments handled by Stripe. No hidden fees. Cancel anytime.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
