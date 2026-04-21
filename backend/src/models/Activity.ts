import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'resume' | 'interview' | 'linkedin' | 'job' | 'roadmap';
  title: string;
  description: string;
  link?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['resume', 'interview', 'linkedin', 'job', 'roadmap'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    link: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

ActivitySchema.index({ userId: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
