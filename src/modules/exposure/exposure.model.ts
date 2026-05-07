import mongoose, { Schema, Document } from 'mongoose';

/* ── Hierarchy step (sub-document) ──────────────────────────── */
export interface IHierarchyStep {
  step: string;
  suds: number;           // original SUDS when plan was created (fixed)
  originalSuds: number;   // alias kept for clarity — same as suds at creation
  currentSuds?: number;   // latest SUDS from most recent weekly review
  completed: boolean;
  completedAt?: Date;
  attempts: number;       // total practice attempts logged
  mastered: boolean;      // true when currentSuds ≤ 2
  plannedDay?: string;    // day user plans to practice next
}

const hierarchyStepSchema = new Schema<IHierarchyStep>(
  {
    step:         { type: String, required: true, trim: true },
    suds:         { type: Number, required: true, min: 0, max: 10 },
    originalSuds: { type: Number, required: true, min: 0, max: 10 },
    currentSuds:  { type: Number, min: 0, max: 10 },
    completed:    { type: Boolean, default: false },
    completedAt:  { type: Date },
    attempts:     { type: Number, default: 0, min: 0 },
    mastered:     { type: Boolean, default: false },
    plannedDay:   { type: String, trim: true },
  },
  { _id: true }      // each step gets its own _id for easy referencing
);

/* ── Exposure Plan (main document) ──────────────────────────── */
export interface IExposurePlan extends Document {
  userId: mongoose.Types.ObjectId;
  selectedBehavior: string;
  hierarchy: IHierarchyStep[];
  currentWeek: number;
  progressPercent: number;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const exposurePlanSchema = new Schema<IExposurePlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    selectedBehavior: {
      type: String,
      required: [true, 'Selected behavior is required'],
      trim: true,
    },
    hierarchy: {
      type: [hierarchyStepSchema],
      validate: {
        validator: (v: IHierarchyStep[]) => v.length >= 1 && v.length <= 10,
        message: 'Hierarchy must have between 1 and 10 steps',
      },
    },
    currentWeek: {
      type: Number,
      default: 1,
      min: 1,
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
  },
  { timestamps: true }
);

export const ExposurePlan = mongoose.model<IExposurePlan>('ExposurePlan', exposurePlanSchema);
