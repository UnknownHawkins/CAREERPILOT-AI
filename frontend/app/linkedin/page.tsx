'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks';
import { linkedinApi } from '@/lib/api';
import { cn, getScoreColor } from '@/lib/utils';
import { LinkedInReview } from '@/components/dashboard';
import {
  Linkedin,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LinkedInAnalysis {
  headline: { score: number; feedback: string; suggestions: string[] };
  summary: { score: number; feedback: string; suggestions: string[] };
  experience: { score: number; feedback: string; suggestions: string[] };
  skills: { score: number; feedback: string; suggestions: string[]; topSkills: string[]; missingSkills: string[] };
  overallScore: number;
  optimizationTips: string[];
  keywordDensity: { keywords: string[]; score: number };
}

export default function LinkedInPage() {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">LinkedIn Profile Review</h1>
          <p className="text-muted-foreground mt-1">
            Optimize your LinkedIn profile to attract recruiters and opportunities
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Analysis</TabsTrigger>
            <TabsTrigger value="checklist">Optimization Checklist</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <LinkedInReview />

          </TabsContent>

          <TabsContent value="checklist">
            <Card>
              <CardHeader>
                <CardTitle>LinkedIn Optimization Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Profile Essentials</h4>
                    <ul className="space-y-2">
                      {[
                        'Professional headshot photo',
                        'Custom background banner',
                        'Compelling headline with keywords',
                        'Detailed About section (40+ words)',
                        'Complete Experience section',
                        'Education details filled out',
                        '50+ skills listed',
                        '3+ recommendations',
                        'Custom LinkedIn URL',
                      ].map((item, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Activity & Engagement</h4>
                    <ul className="space-y-2">
                      {[
                        'Post regularly (2-3x per week)',
                        'Engage with others content',
                        'Join relevant industry groups',
                        'Share industry insights',
                        'Request recommendations',
                      ].map((item, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
