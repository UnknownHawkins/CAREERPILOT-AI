'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks';
import { roadmapApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Map,
  Plus,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Award,
  Briefcase,
  Users,
  ChevronRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const levels = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'executive', label: 'Executive' },
];

const milestoneCategories: Record<string, { icon: any, color: string }> = {
  skill: { icon: BookOpen, color: 'bg-blue-500' },
  certification: { icon: Award, color: 'bg-purple-500' },
  experience: { icon: Briefcase, color: 'bg-green-500' },
  project: { icon: Target, color: 'bg-orange-500' },
  networking: { icon: Users, color: 'bg-pink-500' },
};

interface Roadmap {
  _id: string;
  targetRole: string;
  targetLevel: string;
  industry: string;
  progress: { completedMilestones: number; totalMilestones: number; percentage: number };
  targetSkills: string[];
  milestones: {
    id: string;
    title: string;
    description: string;
    category: keyof typeof milestoneCategories;
    priority: 'high' | 'medium' | 'low';
    estimatedDuration: string;
    completed: boolean;
    resources: { title: string; url: string; type: string }[];
  }[];
  timeline: { shortTerm: string[]; midTerm: string[]; longTerm: string[] };
  estimatedTimeToGoal: string;
}

export default function RoadmapPage() {
  const toast = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    targetRole: '',
    targetLevel: '',
    industry: '',
  });

  const createRoadmap = async () => {
    if (!formData.targetRole || !formData.targetLevel || !formData.industry) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      const response = (await roadmapApi.createRoadmap(formData)) as any;
      setRoadmaps([response.data, ...roadmaps]);
      setShowCreateForm(false);
      setFormData({ targetRole: '', targetLevel: '', industry: '' });
      toast.success('Career roadmap created!');
    } catch (error: any) {
      toast.error('Failed to create roadmap', error.response?.data?.message);
    } finally {
      setIsCreating(false);
    }
  };

  const completeMilestone = async (roadmapId: string, milestoneId: string) => {
    try {
      await roadmapApi.completeMilestone(roadmapId, milestoneId);
      setRoadmaps(roadmaps.map(roadmap => {
        if (roadmap._id === roadmapId) {
          const updatedMilestones = roadmap.milestones.map(m =>
            m.id === milestoneId ? { ...m, completed: true } : m
          );
          const completedCount = updatedMilestones.filter(m => m.completed).length;
          return {
            ...roadmap,
            milestones: updatedMilestones,
            progress: {
              ...roadmap.progress,
              completedMilestones: completedCount,
              percentage: Math.round((completedCount / roadmap.milestones.length) * 100),
            },
          };
        }
        return roadmap;
      }));
      toast.success('Milestone completed!');
    } catch (error) {
      toast.error('Failed to complete milestone');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Career Roadmaps</h1>
            <p className="text-muted-foreground mt-1">
              Plan and track your career growth journey
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showCreateForm ? 'Cancel' : 'Create Roadmap'}
          </Button>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Create New Career Roadmap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Target Role *</Label>
                      <Input
                        placeholder="e.g., Engineering Manager"
                        value={formData.targetRole}
                        onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Level *</Label>
                      <Select
                        value={formData.targetLevel}
                        onValueChange={(value) => setFormData({ ...formData, targetLevel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Industry *</Label>
                      <Input
                        placeholder="e.g., Technology"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createRoadmap} isLoading={isCreating}>
                      Generate Roadmap
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roadmaps List */}
        <div className="space-y-6">
          {roadmaps.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No roadmaps yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first career roadmap to start tracking your goals
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Roadmap
                </Button>
              </CardContent>
            </Card>
          ) : (
            roadmaps.map((roadmap: Roadmap) => (
              <Card key={roadmap._id} className="glass-morphism border-primary/20 overflow-hidden group mb-6">
                <CardHeader className="relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Map className="w-24 h-24 rotate-12" />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                        <Target className="w-6 h-6 text-primary" />
                        {roadmap.targetRole}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-primary/5 border-primary/20">
                          {levels.find(l => l.value === roadmap.targetLevel)?.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">in {roadmap.industry}</span>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none ml-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {roadmap.estimatedTimeToGoal}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{roadmap.progress.percentage}%</div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Progress
                      </p>
                    </div>
                  </div>
                  <Progress value={roadmap.progress.percentage} className="mt-6 h-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Skills Section */}
                  {roadmap.targetSkills && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Target Skillset</h4>
                      <div className="flex flex-wrap gap-2">
                        {roadmap.targetSkills.map((skill: string) => (
                          <Badge key={skill} className="bg-primary/20 text-primary border-primary/30 py-0.5 px-2">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Timeline Overview */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Short Term (0-3 months)
                      </h4>
                      <ul className="space-y-1">
                        {roadmap.timeline.shortTerm.slice(0, 3).map((item: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Mid Term (3-6 months)
                      </h4>
                      <ul className="space-y-1">
                        {roadmap.timeline.midTerm.slice(0, 3).map((item: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Long Term (6-12 months)
                      </h4>
                      <ul className="space-y-1">
                        {roadmap.timeline.longTerm.slice(0, 3).map((item: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h4 className="font-medium mb-3">Milestones</h4>
                    <div className="space-y-2">
                      {roadmap.milestones.slice(0, 5).map((milestone: any) => {
                        const category = milestoneCategories[milestone.category];
                        const Icon = category.icon;
                        return (
                          <div
                            key={milestone.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                              milestone.completed ? 'bg-muted' : 'hover:bg-accent'
                            )}
                          >
                            <button
                              onClick={() => !milestone.completed && completeMilestone(roadmap._id, milestone.id)}
                              className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                                milestone.completed
                                  ? 'bg-green-500 text-white'
                                  : 'border-2 border-muted-foreground hover:border-primary'
                              )}
                            >
                              {milestone.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            </button>
                            <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className={cn('font-medium text-white', milestone.completed && 'line-through text-gray-500')}>
                                {milestone.title}
                              </p>
                              <p className="text-sm text-gray-400 mb-2">{milestone.description}</p>
                              
                              {/* External Resources */}
                              {milestone.resources && milestone.resources.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {milestone.resources.map((res: any, i: number) => (
                                    <a
                                      key={i}
                                      href={res.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[10px] text-primary transition-all"
                                    >
                                      <BookOpen className="w-3 h-3" />
                                      {res.title}
                                      <ChevronRight className="w-2 h-2" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={milestone.priority === 'high' ? 'destructive' : milestone.priority === 'medium' ? 'warning' : 'secondary'} className="text-[10px] uppercase">
                                {milestone.priority}
                              </Badge>
                              <span className="text-[10px] text-gray-500 font-mono">{milestone.estimatedDuration}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {roadmap.milestones.length > 5 && (
                      <Button variant="ghost" className="w-full mt-2">
                        View all {roadmap.milestones.length} milestones
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
