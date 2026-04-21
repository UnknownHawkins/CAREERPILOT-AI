'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
} from '@/components/ui';
import {
  User,
  Bell,
  Shield,
  Moon,
  Sun,
  Monitor,
  CreditCard,
  Lock,
  Smartphone,
  Check,
  Crown,
  Rocket,
  Zap,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import { useToast } from '@/hooks';
import { cn } from '@/lib/utils';
import { subscriptionApi } from '@/lib/api';

type Section = 'general' | 'notifications' | 'security' | 'billing';

const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'general',       label: 'General',       icon: User       },
  { id: 'notifications', label: 'Notifications',  icon: Bell       },
  { id: 'security',      label: 'Security',       icon: Shield     },
  { id: 'billing',       label: 'Billing',        icon: CreditCard },
];

export default function SettingsPage() {
  const { user, setUser, refreshUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const toast = useToast();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<Section>('general');
  const [loading, setLoading] = useState(false);

  // Notification toggles
  const [emailNotif, setEmailNotif]             = useState(true);
  const [interviewReminder, setInterviewReminder] = useState(true);
  const [marketingEmails, setMarketingEmails]   = useState(false);
  const [weeklyDigest, setWeeklyDigest]         = useState(true);

  // Security fields
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [twoFA, setTwoFA]         = useState(false);

  // Billing state
  const [billingHistory, setBillingHistory]   = useState<any[]>([]);
  const [billingLoading, setBillingLoading]   = useState(false);
  const [upgradeLoading, setUpgradeLoading]   = useState<string | null>(null);
  const [cancelLoading, setCancelLoading]     = useState(false);

  const currentPlan =
    user?.role === 'pro'        ? 'Pro'
    : user?.role === 'enterprise' ? 'Enterprise'
    : user?.role === 'admin'    ? 'Admin'
    : 'Free';

  // Fetch billing history when billing tab opens
  useEffect(() => {
    if (activeSection === 'billing' && currentPlan !== 'Free' && currentPlan !== 'Admin') {
      setBillingLoading(true);
      subscriptionApi.getBillingHistory()
        .then((res: any) => setBillingHistory(res.data || []))
        .catch(() => {})
        .finally(() => setBillingLoading(false));
    }
  }, [activeSection, currentPlan]);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings updated successfully');
    }, 900);
  };

  const handlePasswordChange = () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error('All password fields are required');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPw.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      toast.success('Password changed successfully');
    }, 900);
  };

  const toggle = (val: boolean, setter: (v: boolean) => void, label: string) => {
    setter(!val);
    toast.success(`${label} ${!val ? 'enabled' : 'disabled'}`);
  };

  /* ─── Toggle Switch ─── */
  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );

  /* ─── Section: General ─── */
  const GeneralSection = () => (
    <>
      <Card className="glass-morphism border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Account Information
          </CardTitle>
          <CardDescription>Update your personal details and how others see you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue={user?.firstName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue={user?.lastName} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" defaultValue={user?.email} disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed after registration</p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how CareerPilot AI looks on your device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme Mode</Label>
              <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <Select value={theme} onValueChange={(v: any) => setTheme(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2"><Sun className="w-4 h-4" /><span>Light</span></div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2"><Moon className="w-4 h-4" /><span>Dark</span></div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2"><Monitor className="w-4 h-4" /><span>System</span></div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} isLoading={loading}>Save Changes</Button>
      </div>
    </>
  );

  /* ─── Section: Notifications ─── */
  const NotificationsSection = () => (
    <>
      <Card className="glass-morphism border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how and when you receive updates from CareerPilot AI</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/40">
          {[
            {
              label: 'Email Notifications',
              desc: 'Receive updates about your job matches',
              val: emailNotif,
              set: setEmailNotif,
            },
            {
              label: 'Interview Reminders',
              desc: 'Get notified before your mock sessions',
              val: interviewReminder,
              set: setInterviewReminder,
            },
            {
              label: 'Weekly Digest',
              desc: 'A summary of your career progress every week',
              val: weeklyDigest,
              set: setWeeklyDigest,
            },
            {
              label: 'Marketing Emails',
              desc: 'Stay updated with new features and offers',
              val: marketingEmails,
              set: setMarketingEmails,
            },
          ].map(({ label, desc, val, set }) => (
            <div key={label} className="flex items-center justify-between py-4">
              <div className="space-y-0.5">
                <Label>{label}</Label>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <ToggleSwitch checked={val} onChange={() => toggle(val, set, label)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );

  /* ─── Section: Security ─── */
  const SecuritySection = () => (
    <>
      <Card className="glass-morphism border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPw">Current Password</Label>
            <Input
              id="currentPw"
              type="password"
              placeholder="Enter current password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPw">New Password</Label>
            <Input
              id="newPw"
              type="password"
              placeholder="At least 8 characters"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPw">Confirm New Password</Label>
            <Input
              id="confirmPw"
              type="password"
              placeholder="Repeat new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handlePasswordChange} isLoading={loading}>
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-morphism border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Require a verification code when signing in
              </p>
            </div>
            <ToggleSwitch
              checked={twoFA}
              onChange={() => toggle(twoFA, setTwoFA, 'Two-Factor Authentication')}
            />
          </div>
          {twoFA && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                2FA is active. You will be prompted for a verification code on next login.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-morphism border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions — proceed with caution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-destructive">Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-colors"
              onClick={() => toast.error('Account deletion requires email confirmation')}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );

  /* ─── Section: Billing ─── */
  const BillingSection = () => {
    const planDetails: Record<string, { icon: any; color: string; bg: string; price: string; limits: string[] }> = {
      Free: {
        icon: Rocket,
        color: 'text-muted-foreground',
        bg: 'bg-muted/30',
        price: '$0 / mo',
        limits: ['2 Resume Analyses / mo', '2 Mock Interviews / mo', '2 LinkedIn Reviews / mo'],
      },
      Pro: {
        icon: Crown,
        color: 'text-primary',
        bg: 'bg-primary/10',
        price: '$9 / mo',
        limits: ['Unlimited Resume Analysis', 'Unlimited Interviews', 'Priority Support'],
      },
      Enterprise: {
        icon: Zap,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        price: '$29 / mo',
        limits: ['Everything in Pro', 'Team Management & SSO', 'Dedicated Success Manager'],
      },
      Admin: {
        icon: Zap,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        price: 'Internal',
        limits: ['Full platform access', 'Admin dashboard', 'Manage all users'],
      },
    };

    const plan = planDetails[currentPlan] ?? planDetails.Free;
    const PlanIcon = plan.icon;

    const handleUpgradeClick = async (targetPlan: 'pro' | 'enterprise') => {
      setUpgradeLoading(targetPlan);
      try {
        const res: any = await subscriptionApi.mockUpgrade(targetPlan);
        setUser(res.data);
        toast.success(`🎉 Upgraded to ${targetPlan === 'pro' ? 'Pro' : 'Enterprise'}!`, 'Your new features are unlocked.');
      } catch (err: any) {
        toast.error('Upgrade Failed', err.response?.data?.message || 'Please try again.');
      } finally {
        setUpgradeLoading(null);
      }
    };

    const handleCancel = async () => {
      if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) return;
      setCancelLoading(true);
      try {
        await subscriptionApi.cancelSubscription('user_request');
        await refreshUser();
        toast.success('Subscription cancelled', 'You have been moved to the Free plan.');
        setBillingHistory([]);
      } catch (err: any) {
        toast.error('Cancellation Failed', err.response?.data?.message || 'Please try again.');
      } finally {
        setCancelLoading(false);
      }
    };

    return (
      <>
        {/* Current Plan Card */}
        <Card className="glass-morphism border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Current Plan
            </CardTitle>
            <CardDescription>Your active subscription and usage details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={cn('rounded-xl p-5 flex items-center gap-4', plan.bg)}>
              <div className={cn('p-3 rounded-xl bg-background/60', plan.color)}>
                <PlanIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{currentPlan} Plan</h3>
                  <Badge 
                    variant={user?.subscription?.status === 'active' ? 'success' : 'secondary'}
                  >
                    {user?.subscription?.status === 'active' ? 'Active' : 
                     user?.subscription?.status === 'cancelled' ? 'Cancelled' : 
                     user?.subscription?.status === 'expired' ? 'Expired' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{plan.price}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Your Inclusions
              </p>
              <ul className="space-y-2">
                {plan.limits.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade options for Free users */}
        {(currentPlan === 'Free' || user?.subscription?.status !== 'active') && (
          <Card className="glass-morphism border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="w-5 h-5 text-primary" />
                Upgrade Your Plan
              </CardTitle>
              <CardDescription>Unlock unlimited access with a paid plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-primary/20 bg-background/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Pro</span>
                    <span className="text-primary font-bold">$9/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Unlimited analyses, interviews & LinkedIn reviews</p>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleUpgradeClick('pro')}
                    isLoading={upgradeLoading === 'pro'}
                    disabled={upgradeLoading !== null}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
                <div className="rounded-xl border border-yellow-500/20 bg-background/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Enterprise</span>
                    <span className="text-yellow-500 font-bold">$29/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Teams, SSO, dedicated manager & custom API</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => handleUpgradeClick('enterprise')}
                    isLoading={upgradeLoading === 'enterprise'}
                    disabled={upgradeLoading !== null}
                  >
                    Get Enterprise
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade prompt for Pro users to move to Enterprise */}
        {currentPlan === 'Pro' && user?.subscription?.status === 'active' && (
          <Card className="glass-morphism border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="py-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Need more power?</p>
                <p className="text-sm text-muted-foreground">Upgrade to Enterprise for teams, SSO & dedicated support.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpgradeClick('enterprise')}
                isLoading={upgradeLoading === 'enterprise'}
                disabled={upgradeLoading !== null}
              >
                Get Enterprise
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Billing History */}
        <Card className="glass-morphism border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Billing History</CardTitle>
            <CardDescription>Your past invoices and payment records</CardDescription>
          </CardHeader>
          <CardContent>
            {currentPlan === 'Free' || currentPlan === 'Admin' ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No billing history — you're on the {currentPlan === 'Admin' ? 'admin' : 'free'} plan.
              </p>
            ) : billingLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading history…</p>
            ) : billingHistory.length > 0 ? (
              <div className="divide-y divide-border/40">
                {billingHistory.map((inv: any, i: number) => (
                  <div key={inv.id ?? i} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-muted-foreground">
                      {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="font-medium">${(inv.amount / 100 || inv.amount).toFixed(2)}</span>
                    <Badge variant="success">{inv.status === 'paid' ? 'Paid' : inv.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No invoices found yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cancel subscription - ONLY show if status is active */}
        {(currentPlan === 'Pro' || currentPlan === 'Enterprise') && user?.subscription?.status === 'active' && (
          <Card className="glass-morphism border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive text-base">
                <AlertTriangle className="w-4 h-4" />
                Cancel Subscription
              </CardTitle>
              <CardDescription>You will keep access until the end of your billing period.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-colors"
                onClick={handleCancel}
                isLoading={cancelLoading}
              >
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  const sectionMap: Record<Section, React.ReactNode> = {
    general:       <GeneralSection />,
    notifications: <NotificationsSection />,
    security:      <SecuritySection />,
    billing:       <BillingSection />,
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm transition-colors',
                  activeSection === id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {/* Main Settings Content */}
          <div className="md:col-span-3 space-y-6">
            {sectionMap[activeSection]}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
