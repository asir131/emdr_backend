import mongoose, { Schema, Document } from 'mongoose';

export type QuestionnaireType = 'phq9' | 'gad7' | 'des11';
export type SeverityLevel = 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';

export interface IQuestionnaire extends Document {
  userId:    mongoose.Types.ObjectId;
  type:      QuestionnaireType;
  answers:   number[];
  score:     number;
  severity?: SeverityLevel;   // phq9 & gad7 only
  createdAt: Date;
  updatedAt: Date;
}

const questionnaireSchema = new Schema<IQuestionnaire>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:     { type: String, enum: ['phq9', 'gad7', 'des11'], required: true, index: true },
    answers:  { type: [Number], required: true },
    score:    { type: Number,   required: true },
    severity: { type: String,   enum: ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'] },
  },
  { timestamps: true }
);

// Index for fast per-user per-type queries
questionnaireSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const Questionnaire = mongoose.model<IQuestionnaire>('Questionnaire', questionnaireSchema);
