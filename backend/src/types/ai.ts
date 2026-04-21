export interface SectionAnalysis {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface SkillsAnalysis extends SectionAnalysis {
  detectedSkills: string[];
  missingSkills: string[];
}

export interface KeywordAnalysis {
  score: number;
  industryKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export interface FormattingAnalysis {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface ResumeAnalysisResult {
  atsScore: number;
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  sections: {
    contactInfo: SectionAnalysis;
    summary: SectionAnalysis;
    experience: SectionAnalysis;
    education: SectionAnalysis;
    skills: SkillsAnalysis;
  };
  keywordOptimization: KeywordAnalysis;
  formatting: FormattingAnalysis;
  improvementSuggestions: string[];
  jobSuggestions: {
    title: string;
    company: string;
    reasoning: string;
    matchScore: number;
  }[];
  matchingRoles: string[];
  skillGapAnalysis: {
    currentSkills: string[];
    recommendedSkills: string[];
    prioritySkills: string[];
  };
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'situational' | 'culture_fit' | 'leadership';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedAnswerPoints: string[];
}

export interface InterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

export interface LinkedInAnalysis {
  headline: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  summary: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  experience: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  skills: {
    score: number;
    feedback: string;
    suggestions: string[];
    topSkills: string[];
    missingSkills: string[];
  };
  overallScore: number;
  optimizationTips: string[];
  keywordDensity: {
    keywords: string[];
    score: number;
  };
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  category: 'skill' | 'certification' | 'experience' | 'project' | 'networking';
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
  resources: {
    title: string;
    type: 'course' | 'book' | 'article' | 'video' | 'project';
    url?: string;
    provider?: string;
  }[];
  dependencies: string[];
}

export interface CareerRoadmap {
  targetSkills: string[];
  skillGaps: {
    skill: string;
    importance: 'critical' | 'important' | 'nice_to_have';
    currentProficiency: number;
    targetProficiency: number;
    learningResources: string[];
  }[];
  milestones: RoadmapMilestone[];
  timeline: {
    shortTerm: string[];
    midTerm: string[];
    longTerm: string[];
  };
  estimatedTimeToGoal: string;
}

export interface JobMatchAnalysis {
  matchScore: number;
  skillMatch: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    additionalSkills: string[];
  };
  experienceMatch: {
    score: number;
    userYears: number;
    requiredYears: number;
    feedback: string;
  };
  educationMatch: {
    score: number;
    matched: boolean;
    feedback: string;
  };
  overallFit: {
    score: number;
    feedback: string;
    strengths: string[];
    gaps: string[];
  };
  recommendations: {
    shouldApply: boolean;
    confidence: number;
    reasoning: string;
    suggestedActions: string[];
  };
}
