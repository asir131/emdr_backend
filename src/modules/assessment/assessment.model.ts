import mongoose, { Schema, Document } from 'mongoose';

export type SeverityLevel = 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';

export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  status: 'pending' | 'approved' | 'cancelled';

  // PHQ-9
  phq9Answers: number[];
  phq9Score: number;
  phq9Severity: SeverityLevel;

  // GAD-7
  gad7Answers: number[];
  gad7Score: number;
  gad7Severity: SeverityLevel;

  // DES-11
  des11Answers: number[];
  des11Score: number;

  totalScore: number;
  currentStep: 'phq9' | 'gad7' | 'des11' | 'completed';
  isCompleted: boolean;

  requiresProfessionalSupport: boolean;
  recommendation: string;

  createdAt: Date;
  updatedAt: Date;
}

const assessmentSchema = new Schema<IAssessment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'cancelled'], default: 'pending' },

    phq9Answers:   { type: [Number], default: [] },
    phq9Score:     { type: Number },
    phq9Severity:  { type: String, enum: ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'] },

    gad7Answers:   { type: [Number], default: [] },
    gad7Score:     { type: Number },
    gad7Severity:  { type: String, enum: ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'] },

    des11Answers:  { type: [Number], default: [] },
    des11Score:    { type: Number },

    totalScore:    { type: Number },
    currentStep:   { type: String, enum: ['phq9', 'gad7', 'des11', 'completed'], default: 'phq9' },
    isCompleted:   { type: Boolean, default: false },

    requiresProfessionalSupport: { type: Boolean, default: false },
    recommendation: { type: String },
  },
  { timestamps: true }
);

export const Assessment = mongoose.model<IAssessment>('Assessment', assessmentSchema);
