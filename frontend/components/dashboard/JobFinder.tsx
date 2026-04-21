"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Briefcase, Search, Sparkles, MapPin, DollarSign, ExternalLink, BookmarkPlus } from 'lucide-react';
import { jobMatchApi } from '@/lib/api';
import { useToast } from '@/hooks';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function JobFinder() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [criteria, setCriteria] = useState({
    role: '',
    location: '',
    jobType: 'full_time',
    salaryMin: '',
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!criteria.role) {
      toast.error("Please enter a job role");
      return;
    }

    setLoading(true);
    try {
      const response = await jobMatchApi.findJobs(criteria) as any;
      setResults(response.data);
      toast.success(`Found ${response.data.length} matching opportunities!`);
    } catch (err: any) {
      const isLimitError = err.response?.status === 403;
      toast.error(
        isLimitError ? "Limit Reached" : "Discovery Failed", 
        (err.response?.data?.message || "Something went wrong") + (isLimitError ? ". Upgrade to Pro for more searches!" : "")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async (job: any) => {
    try {
      await jobMatchApi.createMatch({
        jobTitle: job.jobTitle,
        company: job.company,
        jobDescription: job.jobDescription,
        requiredSkills: job.requiredSkills,
        location: { city: job.location, remote: false, hybrid: false },
        jobType: criteria.jobType,
        industry: job.industry,
        source: 'ai_search',
        sourceUrl: job.applyLink,
      });
      toast.success("Job saved to your matches!");
    } catch (err: any) {
      toast.error("Failed to save job");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="glass-morphism border-primary/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Briefcase className="w-24 h-24 rotate-12" />
        </div>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">AI Job Finder</CardTitle>
              <CardDescription>Let AI find high-matching opportunities across the web</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="role">Job Role / Title</Label>
              <div className="relative">
                <Input
                  id="role"
                  placeholder="e.g. Frontend Engineer"
                  value={criteria.role}
                  onChange={(e) => setCriteria({ ...criteria, role: e.target.value })}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <Input
                  id="location"
                  placeholder="e.g. Remote"
                  value={criteria.location}
                  onChange={(e) => setCriteria({ ...criteria, location: e.target.value })}
                  className="pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <Button type="submit" disabled={loading} className="btn-premium h-10">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                {loading ? 'Searching...' : 'Find Matches'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {results.map((job, idx) => (
            <Card key={idx} className="group hover:border-primary/50 transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{job.jobTitle}</h3>
                        <p className="font-semibold text-muted-foreground">{job.company}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">
                          {job.matchScore}% Match
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Profile Alignment</span>
                        <span className="font-bold">{job.matchScore}%</span>
                      </div>
                      <Progress value={job.matchScore} className="h-1" />
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 italic">
                      "{job.jobDescription}"
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requiredSkills?.map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-[10px] px-2 py-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:text-primary"
                          onClick={() => handleSaveJob(job)}
                        >
                          <BookmarkPlus className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => window.open(job.applyLink, '_blank')}
                        >
                          Apply Now
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
