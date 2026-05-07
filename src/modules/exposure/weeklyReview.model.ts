import mongoose, { Schema, Document } from 'mongoose';

/* ── Per-step review (sub-document) ─────────────────────────── */
export interface IStepReview {
  stepIndex: number;
  status: 'completed' | 'in-progress' | 'not-started';
  sudsRating?: number;
  problemType?: 'anticipation' | 'during' | 'physical' | 'thoughts' | 'other';
  plannedDay?: string;
  notes?: string;
}

const stepReviewSchema = new Schema<IStepReview>(
  {
    stepIndex:   { type: Number, required: true, min: 0 },
    status:      { type: String, enum: ['completed', 'in-progress', 'not-started'], required: true },
    sudsRating:  { type: Number, min: 0, max: 10 },
    problemType: { type: String, enum: ['anticipation', 'during', 'physical', 'thoughts', 'other'] },
    plannedDay:  { type: String, trim: true },
    notes:       { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

/* ── Weekly summary (sub-document) ──────────────────────────── */
export interface IWeeklySummary {
  completedSteps: number;
  attemptedSteps: number;
  avgSudsReduction: number | null;
}

const weeklySummarySchema = new Schema<IWeeklySummary>(
  {
    completedSteps:   { type: Number, default: 0 },
    attemptedSteps:   { type: Number, default: 0 },
    avgSudsReduction: { type: Number, default: null },
  },
  { _id: false }
);

/* ── Weekly Review (main document) ──────────────────────────── */
export interface IWeeklyReview extends Document {
  planId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  weekNumber: number;
  overallFeeling: 'good' | 'challenging' | 'mixed' | 'unable';
  stepReviews: IStepReview[];
  summary: IWeeklySummary;
  isCompleted: boolean;   // false = session in progress, true = session submitted
  createdAt: Date;
  updatedAt: Date;
}

const weeklyReviewSchema = new Schema<IWeeklyReview>(
  {
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'ExposurePlan',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    overallFeeling: {
      type: String,
      enum: ['good', 'challenging', 'mixed', 'unable'],
      required: true,
    },
    stepReviews: {
      type: [stepReviewSchema],
      default: [],
    },
    summary: {
      type: weeklySummarySchema,
      default: () => ({ completedSteps: 0, attemptedSteps: 0, avgSudsReduction: null }),
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One review per plan per week
weeklyReviewSchema.index({ planId: 1, weekNumber: 1 }, { unique: true });

export const WeeklyReview = mongoose.model<IWeeklyReview>('WeeklyReview', weeklyReviewSchema);
