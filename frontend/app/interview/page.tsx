'use client';

import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks';
import { interviewApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Play,
  CheckCircle,
  Clock,
  Trophy,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Mic,
  StopCircle,
  Volume2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InterviewStream } from '@/components/interview/InterviewStream';

const experienceLevels = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5-10 years)' },
  { value: 'executive', label: 'Executive (10+ years)' },
];

interface InterviewSession {
  _id: string;
  jobRole: string;
  experienceLevel: string;
  industry: string;
  status: string;

  overallScore?: number;

  feedback?: {
    summary?: string;
    strengths: string[];
    areasForImprovement: string[];
  };

  questions: {
    id: string;
    question: string;
    category: string;
    difficulty: string;
    expectedAnswerPoints?: string[];
    userAnswer?: string;
    aiFeedback?: {
      score: number;
      strengths: string[];
      improvements: string[];
      modelAnswer: string;
    };
  }[];
}


export default function InterviewPage() {
  const router = useRouter();
  const toast = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Form state
  const [jobRole, setJobRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [industry, setIndustry] = useState('');
  const [skills, setSkills] = useState('');

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // TTS Ref
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    if (session && !sessionComplete && voiceEnabled) {
      speakQuestion(session.questions[currentQuestionIndex].question);
    }
  }, [currentQuestionIndex, session]);

  const speakQuestion = (text: string) => {
    if (!synthesisRef.current || !voiceEnabled) return;
    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    synthesisRef.current.speak(utterance);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording started...');
    } catch (err) {
      console.error('Recording error:', err);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsAIThinking(true);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'answer.webm');
      
      const response = (await interviewApi.transcribe(formData)) as any;
      setAnswer(response.data.transcription);
      toast.success('Transcription complete!');
    } catch (err) {
      toast.error('Failed to transcribe audio');
    } finally {
      setIsAIThinking(false);
    }
  };

  const createSession = async () => {
    if (!jobRole || !experienceLevel || !industry) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      const response = (await interviewApi.createSession({
        jobRole,
        experienceLevel,
        industry,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      })) as any;

      setSession(response.data);
      toast.success('Interview session created!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create session';
      toast.error('Limit Reached', message + '. Tap "Upgrade Plan" in the sidebar to get unlimited access!');
      if (error.response?.status === 403) {
        setTimeout(() => router.push('/pricing'), 3000);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !session) return;

    setIsSubmitting(true);
    try {
      const currentQuestion = session.questions[currentQuestionIndex];
      await interviewApi.submitAnswer(session._id, {
        questionId: currentQuestion.id,
        answer,
        timeTaken: 0,
      });

      const updatedQuestions = [...session.questions];
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        userAnswer: answer,
      };
      setSession({ ...session, questions: updatedQuestions });

      if (currentQuestionIndex < session.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setAnswer('');
      } else {
        await completeSession();
      }
    } catch (error: any) {
      toast.error('Failed to submit answer', error.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeSession = async () => {
    if (!session) return;
    try {
      const response: any = await interviewApi.completeSession(session._id);
      setSession(response.data);
      setSessionComplete(true);
      toast.success('Interview completed! Check your feedback.');
    } catch (error: any) {
      toast.error('Failed to complete session', error.response?.data?.message);
    }
  };

  const resetSession = () => {
    setSession(null);
    setCurrentQuestionIndex(0);
    setAnswer('');
    setSessionComplete(false);
    setJobRole('');
    setExperienceLevel('');
    setIndustry('');
    setSkills('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text">
              Immersive AI Interview
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Realistic simulation powered by Groq Whisper & Vision
            </p>
          </div>
          {session && !sessionComplete && (
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="gap-2"
              >
               <Volume2 className={cn("w-4 h-4", !voiceEnabled && "text-muted-foreground")} />
               {voiceEnabled ? "Voice Enabled" : "Voice Muted"}
             </Button>
          )}
        </div>

        {/* Setup Form */}
        {!session && (
          <Card className="border-2 border-primary/10 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                Configure Your Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="jobRole" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Target Job Role *</Label>
                  <Input
                    id="jobRole"
                    placeholder="e.g., Senior Full Stack Engineer"
                    className="h-12 bg-muted/50 border-white/10"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Industry *</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Tech / Fintech"
                    className="h-12 bg-muted/50 border-white/10"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Experience Level *</Label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger className="h-12 bg-muted/50 border-white/10">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Key Skills (Optional)</Label>
                  <Input
                    id="skills"
                    placeholder="React, AWS, Python..."
                    className="h-12 bg-muted/50 border-white/10"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={createSession}
                isLoading={isCreating}
                className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform"
                size="lg"
              >
                <Play className="w-5 h-5 mr-3 fill-current" />
                Initialize Interview Room
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Interview Session */}
        <AnimatePresence mode="wait">
          {session && !sessionComplete && (
            <motion.div
              key="interview-active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid gap-6 lg:grid-cols-3"
            >
              <div className="lg:col-span-2 space-y-6">
                {/* Immersive Stream Component */}
                <InterviewStream 
                  isRecording={isRecording}
                  isAIThinking={isAIThinking}
                  sessionActive={!!session}
                />

                <Card className="bg-muted/30 border-white/5 backdrop-blur-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <Badge variant="secondary" className="px-3">Q{currentQuestionIndex + 1}</Badge>
                       <h3 className="text-xl font-semibold">{session.questions[currentQuestionIndex].question}</h3>
                    </div>
                    
                    <div className="relative group">
                      <textarea
                        className="w-full min-h-[120px] p-6 rounded-2xl border-2 border-white/5 bg-black/40 text-lg resize-none focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all group-hover:bg-black/50"
                        placeholder="Your transcribed answer will appear here..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                      />
                      {isAIThinking && (
                         <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="font-medium">
                              Converting speech to text...
                            </motion.div>
                         </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex gap-2">
                        {!isRecording ? (
                          <Button 
                            variant="default" 
                            size="lg" 
                            onClick={startRecording}
                            className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-full font-bold shadow-xl overflow-hidden group relative"
                          >
                            <Mic className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Record Answer
                            <motion.div 
                              className="absolute inset-0 bg-white/10"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            />
                          </Button>
                        ) : (
                          <Button 
                            variant="destructive" 
                            size="lg" 
                            onClick={stopRecording}
                            className="h-14 px-8 rounded-full font-bold shadow-xl animate-pulse"
                          >
                            <StopCircle className="w-5 h-5 mr-2" />
                            Finish Speaking
                          </Button>
                        )}
                      </div>

                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={submitAnswer}
                        isLoading={isSubmitting}
                        disabled={!answer.trim() || isRecording}
                        className="h-14 px-10 rounded-full font-bold shadow-md hover:translate-x-1 transition-transform"
                      >
                        {currentQuestionIndex < session.questions.length - 1 ? (
                          <>
                            Next
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        ) : (
                          <>
                            Complete
                            <CheckCircle className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Session Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-2xl font-bold">
                       <span>{currentQuestionIndex + 1} / {session.questions.length}</span>
                       <span className="text-primary">{Math.round(((currentQuestionIndex + 1) / session.questions.length) * 100)}%</span>
                    </div>
                    <Progress value={((currentQuestionIndex + 1) / session.questions.length) * 100} className="h-3" />
                    
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <p className="text-xs text-muted-foreground">CURRENT ROLE</p>
                      <p className="font-semibold text-sm truncate">{session.jobRole}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="p-2 bg-primary/20 rounded-full text-primary">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary uppercase">Pro Tip</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Speak clearly and maintain eye contact with your camera. We're transcribing your answer in real-time.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session Complete */}
        <AnimatePresence>
          {sessionComplete && session && (
            <motion.div
              layoutId="feedback-layout"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Card className="border-2 border-yellow-500/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                   <Trophy className="w-48 h-48 rotate-12" />
                </div>
                <CardHeader className="flex-row items-center justify-between border-b border-white/5 pb-6">
                  <div className="space-y-1">
                    <CardTitle className="text-3xl flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                      Interview Report
                    </CardTitle>
                    <p className="text-muted-foreground">Constructive analysis of your performance</p>
                  </div>
                  <Button variant="outline" size="lg" onClick={resetSession} className="rounded-full gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Practice Again
                  </Button>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="grid md:grid-cols-3 gap-8 items-center mb-12">
                    <div className="text-center space-y-2 col-span-1 border-r border-white/5 py-4">
                      <div className="text-7xl font-black text-primary drop-shadow-lg">
                        {session.overallScore}%
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Performance Score</p>
                    </div>
                    
                    <div className="col-span-2 space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        AI Summary
                      </h4>
                      <p className="text-lg leading-relaxed text-zinc-300 italic divide-x divide-zinc-700 underline-offset-4 decoration-primary/30">
                        "{session.feedback?.summary}"
                      </p>
                    </div>
                  </div>

                  {session.feedback && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-green-500/5 rounded-3xl p-6 border border-green-500/10 h-full">
                        <h4 className="font-bold mb-4 flex items-center gap-3 text-green-500">
                          <CheckCircle className="w-6 h-6" />
                          Key Strengths
                        </h4>
                        <ul className="space-y-4">
                          {session.feedback.strengths.map((strength, i) => (
                            <motion.li 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              key={i} 
                              className="flex gap-3 text-base text-zinc-400 group"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                              {strength}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-yellow-500/5 rounded-3xl p-6 border border-yellow-500/10 h-full">
                        <h4 className="font-bold mb-4 flex items-center gap-3 text-yellow-500">
                          <Lightbulb className="w-6 h-6" />
                          Growth Areas
                        </h4>
                        <ul className="space-y-4">
                          {session.feedback.areasForImprovement.map((area, i) => (
                            <motion.li 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              key={i} 
                              className="flex gap-3 text-base text-zinc-400 group"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                              {area}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                 {session.questions.map((q, i) => (
                   <Card key={i} className="bg-muted/20 border-white/5 hover:bg-muted/30 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                           <Badge variant="outline">Question {i + 1}</Badge>
                           <Badge variant={q.aiFeedback && q.aiFeedback.score > 70 ? "secondary" : "default"}>
                             Score: {q.aiFeedback?.score || 0}%
                           </Badge>
                        </div>
                        <CardTitle className="text-lg mt-2">{q.question}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-xs text-muted-foreground italic">Your Answer:</div>
                        <p className="text-sm line-clamp-3 text-zinc-400">{q.userAnswer}</p>
                        <div className="pt-2">
                           <Button variant="link" size="sm" className="px-0 text-primary h-auto">View Detailed AI Feedback →</Button>
                        </div>
                      </CardContent>
                   </Card>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
