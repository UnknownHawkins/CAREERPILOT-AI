"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { linkedinApi } from '@/lib/api';
import { useToast } from '@/hooks';
import { Loader2, Linkedin, Search, Star, Target, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LinkedInReview() {
  const toast = useToast();
  const [profileUrl, setProfileUrl] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await linkedinApi.analyze({ 
        profileUrl,
        headline,
        summary
      }) as any;
      setResult(response.data);
      toast.success("Profile analysis completed!");
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to analyze profile. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <Linkedin className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                LinkedIn Profile Optimizer
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enhance your professional presence with AI-driven insights
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleAnalyze} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-gray-300 font-medium">LinkedIn Profile URL</Label>
                <div className="relative">
                   <Input
                    id="url"
                    placeholder="https://linkedin.com/in/username"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    className="bg-black/20 border-white/10 text-white focus:ring-blue-500/50 pl-10 h-12 transition-all"
                    required
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline" className="text-gray-300 font-medium">Current Headline (Optional)</Label>
              <Input
                id="headline"
                placeholder="Software Engineer @ TechCorp"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="bg-black/20 border-white/10 text-white focus:ring-blue-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary" className="text-gray-300 font-medium">Current Summary (Optional)</Label>
              <textarea
                id="summary"
                placeholder="Experienced developer with a passion..."
                value={summary}
                onChange={(e: any) => setSummary(e.target.value)}
                className="w-full flex min-h-[80px] rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-black/20 border-white/10 text-white focus:ring-blue-500/50 min-h-[100px] transition-all"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button 
                type="submit" 
                disabled={loading || !profileUrl}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-6 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] transform"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Profile...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Verify & Analyze
                  </>
                )}
              </Button>
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-6 bg-red-900/20 border-red-500/50 text-red-100 rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 md:grid-cols-2 animate-in slide-in-from-bottom-5 duration-700">
          {/* Overall Score */}
          <Card className="md:col-span-2 backdrop-blur-xl bg-white/5 border-white/10 border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Profile Strength</h3>
                  <p className="text-gray-400">Your profile is currently {result.overallScore}% optimized.</p>
                </div>
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18" cy="18" r="16"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18" cy="18" r="16"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      strokeDasharray={`${result.overallScore}, 100`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-white">
                    {result.overallScore}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Feedback */}
          <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:border-white/20 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <CardTitle className="text-lg text-white">Key Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                    <h5 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Headline</h5>
                    <p className="text-gray-300 text-sm">{result.headline.feedback}</p>
                </div>
                <div className="pt-2 border-t border-white/5">
                    <h5 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2">Summary</h5>
                    <p className="text-gray-300 text-sm">{result.summary.feedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:border-white/20 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-400" />
                <CardTitle className="text-lg text-white">Action Plan</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.optimizationTips.map((tip: string, i: number) => (
                  <li key={i} className="flex gap-3 text-gray-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

           {/* Skills Analysis */}
           <Card className="md:col-span-2 backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
                <CardTitle className="text-lg text-white">Skills Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                   <h5 className="text-sm font-medium text-gray-400 mb-3">Top Strengths</h5>
                   <div className="flex flex-wrap gap-2">
                      {result.skills.topSkills.map((skill: string) => (
                        <span key={skill} className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                   </div>
                </div>
                <div>
                   <h5 className="text-sm font-medium text-gray-400 mb-3">Opportunities (Missing)</h5>
                   <div className="flex flex-wrap gap-2">
                      {result.skills.missingSkills.map((skill: string) => (
                        <span key={skill} className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
