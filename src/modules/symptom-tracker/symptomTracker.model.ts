import mongoose, { Schema, Document, Types } from 'mongoose';


export interface ITrackerItem {
  text   : string;
  reverse: boolean;
}

export interface ITrackerOption {
  value: number;
  label: string;
}

export interface ITrackerBand {
  max        : number;
  label      : string;
  description: string;
}

export interface ITrackerAlert {
  item   : number;
  trigger: '>=1' | '>=2' | '>=3';
  title  : string;
  message: string;
}

export interface ISymptomTrackerConfig extends Document {
  trackerType: string;
  name       : string;
  description: string;
  items      : ITrackerItem[];
  options    : ITrackerOption[];
  bands      : ITrackerBand[];
  alerts     : ITrackerAlert[];
  stemKey    : string | null;
  isActive   : boolean;
  createdBy  : Types.ObjectId;
  updatedBy ?: Types.ObjectId;
  createdAt  : Date;
  updatedAt  : Date;
}

const trackerItemSchema = new Schema<ITrackerItem>(
  {
    text   : { type: String, required: true, trim: true, maxlength: 500 },
    reverse: { type: Boolean, default: false },
  },
  { _id: false }
);

const trackerOptionSchema = new Schema<ITrackerOption>(
  {
    value: { type: Number, required: true },
    label: { type: String, required: true, trim: true, maxlength: 50 },
  },
  { _id: false }
);

const trackerBandSchema = new Schema<ITrackerBand>(
  {
    max        : { type: Number, required: true },
    label      : { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const trackerAlertSchema = new Schema<ITrackerAlert>(
  {
    item   : { type: Number, required: true, min: 1 },
    trigger: { type: String, enum: ['>=1', '>=2', '>=3'], required: true },
    title  : { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const symptomTrackerConfigSchema = new Schema<ISymptomTrackerConfig>(
  {
    trackerType: {
      type     : String,
      required : true,
      unique   : true,
      trim     : true,
      lowercase: true,
      match    : [/^[a-z0-9-]+$/, 'trackerType must be lowercase alphanumeric with hyphens only'],
      maxlength: 50,
    },
    name       : { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    items      : { type: [trackerItemSchema], required: true, validate: [(v: any[]) => v.length >= 1, 'At least 1 item required'] },
    options    : { type: [trackerOptionSchema], required: true, validate: [(v: any[]) => v.length >= 2, 'At least 2 options required'] },
    bands      : { type: [trackerBandSchema], required: true, validate: [(v: any[]) => v.length >= 1, 'At least 1 band required'] },
    alerts     : { type: [trackerAlertSchema], default: [] },
    stemKey    : { type: String, default: null },
    isActive   : { type: Boolean, default: true, index: true },
    createdBy  : { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy  : { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

symptomTrackerConfigSchema.index({ isActive: 1, createdAt: -1 });

export const SymptomTrackerConfig = mongoose.model<ISymptomTrackerConfig>(
  'SymptomTrackerConfig',
  symptomTrackerConfigSchema
);


export interface IItemScore {
  itemIndex: number;   // 0-based index into config.items
  rawAnswer: number;   // what user selected (0-4)
  scored   : number;   // after reverse scoring
}

export interface ISymptomTrackerSubmission extends Document {
  userId      : Types.ObjectId;
  trackerType : string;
  totalScore  : number;
  severityBand: string;
  itemScores  : IItemScore[];
  stemValue  ?: string | null;
  submittedAt : Date;
  createdAt   : Date;
  updatedAt   : Date;
}

const itemScoreSchema = new Schema<IItemScore>(
  {
    itemIndex: { type: Number, required: true, min: 0 },
    rawAnswer: { type: Number, required: true, min: 0 },
    scored   : { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const symptomTrackerSubmissionSchema = new Schema<ISymptomTrackerSubmission>(
  {
    userId: {
      type    : Schema.Types.ObjectId,
      ref     : 'User',
      required: true,
      index   : true,
    },
    trackerType: {
      type     : String,
      required : true,
      trim     : true,
      lowercase: true,
      index    : true,
    },
    totalScore  : { type: Number, required: true, min: 0 },
    severityBand: { type: String, required: true, trim: true },
    itemScores  : { type: [itemScoreSchema], required: true },
    stemValue   : { type: String, trim: true, default: null },
    submittedAt : { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

symptomTrackerSubmissionSchema.index({ userId: 1, trackerType: 1, submittedAt: -1 });
symptomTrackerSubmissionSchema.index({ userId: 1, submittedAt: -1 });

export const SymptomTrackerSubmission = mongoose.model<ISymptomTrackerSubmission>(
  'SymptomTrackerSubmission',
  symptomTrackerSubmissionSchema
);
