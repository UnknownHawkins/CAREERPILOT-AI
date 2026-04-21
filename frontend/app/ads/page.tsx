'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, Coins, Crown, CheckCircle,
  ArrowRight, Tv2, Zap, Star, Gift, Volume2, VolumeX,
} from 'lucide-react';
import { Button, Badge, Card, CardContent } from '@/components/ui';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { subscriptionApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { useToast } from '@/hooks';
import { cn } from '@/lib/utils';

/* ─── Ad catalogue (stored client-side) ─────────────────────── */
const ADS = [
  {
    id: 'ad_1',
    brand: 'TechNova',
    tagline: 'Build the future, one line at a time.',
    description: 'TechNova — the all-in-one platform for modern software teams. Collaborate, ship, and scale faster.',
    bg: 'from-violet-600 via-purple-600 to-indigo-700',
    accent: 'bg-violet-400/20',
    icon: '🚀',
    cta: 'Start Free Trial',
    duration: 15,
  },
  {
    id: 'ad_2',
    brand: 'SkillBridge',
    tagline: 'Your next job is 30 days away.',
    description: 'SkillBridge connects top tech talent with high-growth startups. Get matched in minutes, not months.',
    bg: 'from-cyan-600 via-teal-600 to-emerald-700',
    accent: 'bg-cyan-400/20',
    icon: '🎯',
    cta: 'Find Your Match',
    duration: 15,
  },
  {
    id: 'ad_3',
    brand: 'CloudVault',
    tagline: 'Your data, everywhere, always secure.',
    description: 'CloudVault offers enterprise-grade storage with end-to-end encryption. Trusted by 50,000+ teams worldwide.',
    bg: 'from-amber-600 via-orange-600 to-red-600',
    accent: 'bg-amber-400/20',
    icon: '🔐',
    cta: 'Get 1TB Free',
    duration: 15,
  },
  {
    id: 'ad_4',
    brand: 'LearnLoop',
    tagline: 'Learn anything. Land anywhere.',
    description: 'LearnLoop delivers bite-sized courses from industry experts. 2,000+ courses across tech, design & business.',
    bg: 'from-pink-600 via-rose-600 to-fuchsia-700',
    accent: 'bg-pink-400/20',
    icon: '🎓',
    cta: 'Try for Free',
    duration: 15,
  },
];

const CREDITS_PER_CYCLE = 1;   // 1 credit per 2 ads
const ADS_PER_CREDIT    = 2;   // watch 2 ads to earn 1 credit
const MAX_CREDITS_PER_SESSION = 5; // cap at 5 credits per session

export default function AdsPage() {
  const router = useRouter();
  const toast  = useToast();
  const { user, refreshUser } = useAuthStore();

  /* credit state */
  const [adCredits, setAdCredits]           = useState(0);
  const [adsWatched, setAdsWatched]         = useState(0);
  const [sessionCredits, setSessionCredits] = useState(0);
  const [creditsLoading, setCreditsLoading] = useState(true);

  /* ad playback state */
  const [currentAdIdx, setCurrentAdIdx]   = useState(0);
  const [timeLeft, setTimeLeft]           = useState(15);
  const [playing, setPlaying]             = useState(false);
  const [adComplete, setAdComplete]       = useState(false);
  const [muted, setMuted]                 = useState(false);
  const [claiming, setClaiming]           = useState(false);
  const [showReward, setShowReward]       = useState(false);
  const [rewardMsg, setRewardMsg]         = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentAd = ADS[currentAdIdx % ADS.length];

  /* fetch initial credits */
  useEffect(() => {
    subscriptionApi.getCredits()
      .then((res: any) => {
        setAdCredits(res.data?.adCredits ?? 0);
        setAdsWatched(res.data?.adsWatchedThisSession ?? 0);
      })
      .catch(() => {})
      .finally(() => setCreditsLoading(false));
  }, []);

  /* countdown timer */
  useEffect(() => {
    if (!playing || adComplete) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPlaying(false);
          setAdComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [playing, adComplete]);

  const startAd = () => {
    setPlaying(true);
    setAdComplete(false);
    setTimeLeft(15);
  };

  const pauseAd = () => {
    setPlaying(false);
    clearInterval(timerRef.current!);
  };

  const claimCredit = useCallback(async () => {
    if (sessionCredits >= MAX_CREDITS_PER_SESSION) {
      toast.error('Session limit reached', `Maximum ${MAX_CREDITS_PER_SESSION} credits per session.`);
      return;
    }
    setClaiming(true);
    try {
      const res: any = await subscriptionApi.earnCredit();
      const { credited, adsWatched: newAds, adCredits: newTotal, message } = res.data;
      setAdsWatched(newAds);
      setAdCredits(newTotal);
      if (credited) {
        setSessionCredits(p => p + 1);
        setRewardMsg(`+1 Credit! You now have ${newTotal} credits.`);
        setShowReward(true);
        setTimeout(() => setShowReward(false), 3000);
        toast.success('🎉 Credit Earned!', message);
      } else {
        toast.success('Ad recorded!', message);
      }
      // Advance to next ad
      setCurrentAdIdx(p => p + 1);
      setAdComplete(false);
      setTimeLeft(15);
      setPlaying(false);
    } catch {
      toast.error('Error', 'Could not record ad. Please try again.');
    } finally {
      setClaiming(false);
    }
  }, [sessionCredits, toast]);

  const adsUntilNextCredit = ADS_PER_CREDIT - (adsWatched % ADS_PER_CREDIT);
  const isPro = user?.role === 'pro' || user?.role === 'enterprise' || user?.role === 'admin';

  /* progress arc */
  const progressPct = ((15 - timeLeft) / 15) * 100;
  const circumference = 2 * Math.PI * 44;
  const strokeDash = (progressPct / 100) * circumference;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Tv2 className="w-8 h-8 text-primary" />
              Watch Ads · Earn Credits
            </h1>
            <p className="text-muted-foreground mt-1">
              Watch <span className="text-primary font-semibold">2 ads</span> to earn{' '}
              <span className="text-primary font-semibold">1 search credit</span>. No upgrade needed.
            </p>
          </div>

          {/* Credit counter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <Coins className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">{adCredits}</span>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
            {!isPro && (
              <Button size="sm" variant="outline" onClick={() => router.push('/pricing')}>
                <Crown className="w-4 h-4 mr-1.5 text-primary" />
                Go Pro
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar — ads toward next credit */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress toward next credit</span>
            <span className="font-medium">
              {adsUntilNextCredit === ADS_PER_CREDIT ? `Watch ${ADS_PER_CREDIT} ads` : `${ADS_PER_CREDIT - adsUntilNextCredit + 1} / ${ADS_PER_CREDIT} ads watched`}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((ADS_PER_CREDIT - adsUntilNextCredit) / ADS_PER_CREDIT) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {sessionCredits} credit{sessionCredits !== 1 ? 's' : ''} earned this session ·
            Max {MAX_CREDITS_PER_SESSION} per session
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ad Player */}
          <div className="lg:col-span-2">
            <div className={cn(
              'relative rounded-2xl overflow-hidden bg-gradient-to-br p-8 min-h-[360px] flex flex-col justify-between',
              `bg-gradient-to-br ${currentAd.bg}`
            )}>
              {/* Animated background circles */}
              <div className={cn('absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-0', currentAd.accent)} />
              <div className={cn('absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl -z-0', currentAd.accent)} />

              {/* Mute toggle */}
              <button
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white z-10"
                onClick={() => setMuted(m => !m)}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Ad label */}
              <div className="flex items-center gap-2 z-10">
                <Badge className="bg-white/20 text-white border-none text-xs">ADVERTISEMENT</Badge>
                <Badge className="bg-white/20 text-white border-none text-xs">
                  Ad {(currentAdIdx % ADS.length) + 1} of {ADS.length}
                </Badge>
              </div>

              {/* Ad content */}
              <div className="z-10 space-y-4 my-6">
                <div className="text-6xl">{currentAd.icon}</div>
                <div>
                  <h2 className="text-3xl font-black text-white">{currentAd.brand}</h2>
                  <p className="text-white/80 text-lg font-medium mt-1">{currentAd.tagline}</p>
                  <p className="text-white/60 text-sm mt-3 max-w-sm">{currentAd.description}</p>
                </div>
              </div>

              {/* Controls row */}
              <div className="z-10 flex items-center justify-between">
                {/* Timer ring */}
                <div className="relative w-[100px] h-[100px]">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="44" fill="none"
                      stroke="white" strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - strokeDash}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {adComplete ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <span className="text-white font-black text-2xl">{timeLeft}</span>
                    )}
                  </div>
                </div>

                {/* Play / Claim */}
                <div className="flex gap-3">
                  {!adComplete ? (
                    <Button
                      size="lg"
                      className="bg-white text-gray-900 hover:bg-white/90 font-bold gap-2 rounded-xl"
                      onClick={playing ? pauseAd : startAd}
                    >
                      {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      {playing ? 'Pause' : timeLeft === 15 ? 'Watch Ad' : 'Resume'}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="bg-white text-gray-900 hover:bg-white/90 font-bold gap-2 rounded-xl"
                      onClick={claimCredit}
                      isLoading={claiming}
                      disabled={sessionCredits >= MAX_CREDITS_PER_SESSION}
                    >
                      <Gift className="w-5 h-5" />
                      Claim & Continue
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Floating reward toast */}
            <AnimatePresence>
              {showReward && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3"
                >
                  <Star className="w-5 h-5 text-green-500 fill-green-500" />
                  <span className="text-sm font-medium text-green-600">{rewardMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* How it works */}
            <Card className="glass-morphism border-primary/10">
              <CardContent className="pt-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  How It Works
                </h3>
                {[
                  { step: '1', text: 'Click "Watch Ad" and wait 15 seconds' },
                  { step: '2', text: 'Click "Claim & Continue" after the ad ends' },
                  { step: '3', text: 'Repeat once more (2 ads total)' },
                  { step: '4', text: '🎉 1 search credit added to your account!' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {step}
                    </div>
                    <span className="text-muted-foreground">{text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Ad queue */}
            <Card className="glass-morphism border-primary/10">
              <CardContent className="pt-5 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Ad Queue</h3>
                {ADS.map((ad, i) => {
                  const isWatched = i < currentAdIdx % ADS.length;
                  const isCurrent = i === currentAdIdx % ADS.length;
                  return (
                    <div
                      key={ad.id}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors',
                        isCurrent ? 'bg-primary/10 border border-primary/20' : 'opacity-50'
                      )}
                    >
                      <span className="text-xl">{ad.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ad.brand}</p>
                        <p className="text-xs text-muted-foreground">{ad.duration}s</p>
                      </div>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs shrink-0">Now</Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            {!isPro && (
              <Card className="glass-morphism border-primary/30 bg-primary/5">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Skip the ads</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro for <span className="font-semibold text-primary">unlimited credits</span> — no ads ever.
                  </p>
                  <Button className="w-full gap-2" onClick={() => router.push('/pricing')}>
                    Upgrade to Pro · $9/mo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
