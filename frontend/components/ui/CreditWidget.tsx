'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, Crown, Tv2, ChevronDown, Infinity as InfinityIcon } from 'lucide-react';
import { subscriptionApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

interface CreditData {
  isPro: boolean;
  monthlyLimit: number;
  adCredits: number;
  usage: {
    resumeAnalysis: number;
    interviews: number;
    linkedin: number;
    jobMatch: number;
  };
}

export function CreditWidget({ className }: { className?: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<CreditData | null>(null);
  const [open, setOpen] = useState(false);

  const isPro  = user?.role === 'pro' || user?.role === 'enterprise' || user?.role === 'admin';

  useEffect(() => {
    subscriptionApi.getCredits()
      .then((res: any) => setData(res.data))
      .catch(() => {});
  }, [user?.role]);

  if (!data) return null;

  const { monthlyLimit, adCredits, usage } = data;
  const isUnlimited = monthlyLimit === -1;

  // For free users compute the lowest remaining credit across all features
  const usedMax = Math.max(usage.resumeAnalysis, usage.interviews, usage.linkedin, usage.jobMatch);
  const baseCredits = isUnlimited ? Infinity : Math.max(0, monthlyLimit - usedMax);
  const totalCredits = baseCredits === Infinity ? Infinity : (baseCredits as number) + adCredits;
  const low = !isUnlimited && totalCredits <= 1;

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
          low
            ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20'
            : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20'
        )}
      >
        <Coins className="w-4 h-4" />
        {isUnlimited ? (
          <InfinityIcon className="w-4 h-4" />
        ) : (
          <span>{totalCredits}</span>
        )}
        <span className="hidden sm:inline text-xs opacity-70">credits</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-border/40">
              <p className="font-semibold text-sm">Your Credits</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isUnlimited ? 'Unlimited — Pro plan active' : 'Free plan · resets monthly'}
              </p>
            </div>

            <div className="p-4 space-y-3">
              {isUnlimited ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Crown className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Unlimited Access</p>
                    <p className="text-xs text-muted-foreground">All features unrestricted</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Feature breakdown */}
                  {[
                    { label: 'Resume Analysis', used: usage.resumeAnalysis },
                    { label: 'Mock Interviews',  used: usage.interviews },
                    { label: 'LinkedIn Review',  used: usage.linkedin },
                    { label: 'Job Matching',     used: usage.jobMatch },
                  ].map(({ label, used }) => {
                    const remaining = Math.max(0, monthlyLimit - used) + adCredits;
                    const pct = Math.min(100, (used / monthlyLimit) * 100);
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <span className={cn('font-medium', remaining === 0 ? 'text-red-500' : '')}>
                            {remaining} left
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-red-500' : 'bg-primary')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Ad credits earned */}
                  {adCredits > 0 && (
                    <div className="pt-1 border-t border-border/40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Tv2 className="w-3.5 h-3.5" /> Ad credits earned
                        </span>
                        <span className="font-medium text-green-600">+{adCredits}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            {!isUnlimited && (
              <div className="p-3 border-t border-border/40 flex gap-2">
                <button
                  onClick={() => { setOpen(false); router.push('/ads'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs font-medium"
                >
                  <Tv2 className="w-3.5 h-3.5" />
                  Watch Ads
                </button>
                <button
                  onClick={() => { setOpen(false); router.push('/pricing'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-medium"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Upgrade
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Credit Gate Modal ────────────────────────────────────────
   Drop this anywhere in a feature page. Pass `show` and `onClose`. */
interface CreditGateProps {
  show: boolean;
  onClose: () => void;
  featureName?: string;
}

export function CreditGateModal({ show, onClose, featureName = 'this feature' }: CreditGateProps) {
  const router = useRouter();
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <Coins className="w-7 h-7 text-red-500" />
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-bold">Out of Credits</h2>
            <p className="text-sm text-muted-foreground">
              You've used all your monthly credits for <span className="font-medium">{featureName}</span>.
              Watch 2 short ads to earn more, or upgrade for unlimited access.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { onClose(); router.push('/ads'); }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm"
            >
              <Tv2 className="w-6 h-6 text-primary" />
              <span className="font-medium">Watch Ads</span>
              <span className="text-xs text-muted-foreground">2 ads = 1 credit</span>
            </button>
            <button
              onClick={() => { onClose(); router.push('/pricing'); }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors text-sm"
            >
              <Crown className="w-6 h-6 text-primary" />
              <span className="font-medium text-primary">Go Pro</span>
              <span className="text-xs text-muted-foreground">$9/mo unlimited</span>
            </button>
          </div>
        </div>

        <div className="px-6 pb-4">
          <button onClick={onClose} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
