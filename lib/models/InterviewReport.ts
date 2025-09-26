import mongoose from 'mongoose';

export interface IPerformanceAnalysis {
  communicationSkills: {
    score: number; // 0-100
    strengths: string[];
    improvements: string[];
    feedback: string;
  };
  technicalKnowledge: {
    score: number; // 0-100
    strengths: string[];
    improvements: string[];
    feedback: string;
  };
  problemSolving: {
    score: number; // 0-100
    strengths: string[];
    improvements: string[];
    feedback: string;
  };
  confidence: {
    score: number; // 0-100
    analysis: string;
    recommendations: string[];
  };
  bodyLanguage: {
    score: number; // 0-100
    observations: string[];
    recommendations: string[];
  };
}

export interface IDetailedFeedback {
  overallScore: number; // 0-100
  summary: string;
  keyStrengths: string[];
  areasForImprovement: string[];
  specificFeedback: {
    questionId: string;
    question: string;
    userResponse: string;
    feedback: string;
    score: number;
    suggestions: string[];
  }[];
  behavioralInsights: {
    pauseAnalysis: string;
    speechPaceAnalysis: string;
    confidenceAnalysis: string;
    emotionalStateAnalysis: string;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export interface IInterviewReport extends mongoose.Document {
  interviewId: string;
  sessionId: string;
  userId: string;
  jobTitle: string;
  mentorName: string;
  performanceAnalysis: IPerformanceAnalysis;
  detailedFeedback: IDetailedFeedback;
  interviewDuration: number;
  generatedAt: Date;
  reportVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceAnalysisSchema = new mongoose.Schema({
  communicationSkills: {
    score: { type: Number, required: true, min: 0, max: 100 },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    feedback: { type: String, required: true }
  },
  technicalKnowledge: {
    score: { type: Number, required: true, min: 0, max: 100 },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    feedback: { type: String, required: true }
  },
  problemSolving: {
    score: { type: Number, required: true, min: 0, max: 100 },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    feedback: { type: String, required: true }
  },
  confidence: {
    score: { type: Number, required: true, min: 0, max: 100 },
    analysis: { type: String, required: true },
    recommendations: [{ type: String }]
  },
  bodyLanguage: {
    score: { type: Number, required: true, min: 0, max: 100 },
    observations: [{ type: String }],
    recommendations: [{ type: String }]
  }
});

const DetailedFeedbackSchema = new mongoose.Schema({
  overallScore: { type: Number, required: true, min: 0, max: 100 },
  summary: { type: String, required: true },
  keyStrengths: [{ type: String }],
  areasForImprovement: [{ type: String }],
  specificFeedback: [{
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    userResponse: { type: String, required: true },
    feedback: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    suggestions: [{ type: String }]
  }],
  behavioralInsights: {
    pauseAnalysis: { type: String, required: true },
    speechPaceAnalysis: { type: String, required: true },
    confidenceAnalysis: { type: String, required: true },
    emotionalStateAnalysis: { type: String, required: true }
  },
  recommendations: {
    immediate: [{ type: String }],
    shortTerm: [{ type: String }],
    longTerm: [{ type: String }]
  }
});

const InterviewReportSchema = new mongoose.Schema(
  {
    interviewId: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    mentorName: {
      type: String,
      required: true,
    },
    performanceAnalysis: {
      type: PerformanceAnalysisSchema,
      required: true,
    },
    detailedFeedback: {
      type: DetailedFeedbackSchema,
      required: true,
    },
    interviewDuration: {
      type: Number,
      required: true,
    },
    generatedAt: {
      type: Date,
      required: true,
    },
    reportVersion: {
      type: String,
      default: '1.0',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
InterviewReportSchema.index({ interviewId: 1 });
InterviewReportSchema.index({ userId: 1 });
InterviewReportSchema.index({ generatedAt: -1 });

export default mongoose.models.InterviewReport || 
  mongoose.model<IInterviewReport>('InterviewReport', InterviewReportSchema);
