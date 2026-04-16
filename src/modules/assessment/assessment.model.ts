import mongoose, { Schema, Document } from 'mongoose';

export type SeverityLevel = 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';

export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId;

  // PHQ-9 answers (0-3 each, 9 questions)
  phq9Answers: number[];
  phq9Score: number;
  phq9Severity: SeverityLevel;

  // GAD-7 answers (0-3 each, 7 questions)
  gad7Answers: number[];
  gad7Score: number;
  gad7Severity: SeverityLevel;

  // DES-11 answers (0-100 each, 8 questions)
  des11Answers: number[];
  des11Score: number;

  // Overall recommendation
  requiresProfessionalSupport: boolean;
  recommendation: string;

  createdAt: Date;
  updatedAt: Date;
}

const assessmentSchema = new Schema<IAssessment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    phq9Answers:   { type: [Number], required: true },
    phq9Score:     { type: Number, required: true },
    phq9Severity:  { type: String, enum: ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'] },

    gad7Answers:   { type: [Number], required: true },
    gad7Score:     { type: Number, required: true },
    gad7Severity:  { type: String, enum: ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'] },

    des11Answers:  { type: [Number], required: true },
    des11Score:    { type: Number, required: true },

    requiresProfessionalSupport: { type: Boolean, default: false },
    recommendation: { type: String },
  },
  { timestamps: true }
);

export const Assessment = mongoose.model<IAssessment>('Assessment', assessmentSchema);
