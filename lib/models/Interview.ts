import mongoose from 'mongoose';

export interface IInterview extends mongoose.Document {
  userId: string;
  jobTitle: string;
  jobDescription?: string;
  userSummary: string;
  jobSummary: string;
  mentorId?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  startDateTime?: Date;
  endDateTime?: Date;
  sessionId?: string;
  reportId?: string;
  reportGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
    },
    userSummary: {
      type: String,
      required: true,
    },
    jobSummary: {
      type: String,
      required: true,
    },
    mentorId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed'],
      default: 'scheduled',
    },
    startDateTime: {
      type: Date,
    },
    endDateTime: {
      type: Date,
    },
    sessionId: {
      type: String,
    },
    reportId: {
      type: String,
    },
    reportGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
