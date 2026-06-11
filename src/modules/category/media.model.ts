import mongoose, { Schema, Document } from 'mongoose';

export type MediaStatus = 'active' | 'inactive';
export type MediaType = 'image' | 'video' | 'audio' | 'raw';
export type MediaDefaultFacing = 'left' | 'right';
export type BilateralHitSide = 'left' | 'right' | 'center';
export type BilateralAudioMode = 'one-shot' | 'two-hit-stereo' | 'stereo-track' | 'unknown';

export interface IBilateralAudioProfile {
  mode: BilateralAudioMode;
  durationSec?: number;
  hits?: Array<{
    timeSec: number;
    side: BilateralHitSide;
  }>;
  beatIntervalMs?: number;
  firstBeatSide?: BilateralHitSide;
  preserveOriginalPan?: boolean;
  analysisStatus?: 'pending' | 'success' | 'failed';
  analysisError?: string;
}

export interface IMedia extends Document {
  categoryId:    mongoose.Types.ObjectId;
  name:          string;
  url:           string;
  publicId:      string;
  mediaType:     MediaType;
  originalName:  string;
  size:          number;
  duration?:     number;
  defaultFacing?: MediaDefaultFacing;
  bilateralAudioProfile?: IBilateralAudioProfile;

  // ── Profile media (optional extras per record) ────────────────────────────
  imageProfile?: { url: string; publicId: string; size: number };
  videoProfile?: { url: string; publicId: string; size: number; duration?: number };
  musicProfile?: { url: string; publicId: string; size: number; duration?: number };

  status:     MediaStatus;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt:  Date;
  updatedAt:  Date;
}

const profileMediaSchema = new Schema(
  {
    url:      { type: String, required: true },
    publicId: { type: String, required: true, select: false },
    size:     { type: Number },
    duration: { type: Number },
  },
  { _id: false }
);

const bilateralAudioHitSchema = new Schema(
  {
    timeSec: { type: Number, required: true, min: 0 },
    side:    { type: String, enum: ['left', 'right', 'center'], required: true },
  },
  { _id: false }
);

const bilateralAudioProfileSchema = new Schema(
  {
    mode:                { type: String, enum: ['one-shot', 'two-hit-stereo', 'stereo-track', 'unknown'], required: true },
    durationSec:         { type: Number, min: 0 },
    hits:                { type: [bilateralAudioHitSchema], default: undefined },
    beatIntervalMs:      { type: Number, min: 0 },
    firstBeatSide:       { type: String, enum: ['left', 'right', 'center'] },
    preserveOriginalPan: { type: Boolean, default: true },
    analysisStatus:      { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    analysisError:       { type: String, maxlength: 1000 },
  },
  { _id: false }
);

const mediaSchema = new Schema<IMedia>(
  {
    categoryId:   { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name:         { type: String, required: [true, 'Name is required'], trim: true, maxlength: 200 },
    url:          { type: String, required: true },
    publicId:     { type: String, required: true, select: false },
    mediaType:    { type: String, enum: ['image', 'video', 'audio', 'raw'], required: true },
    originalName: { type: String, trim: true },
    size:         { type: Number },
    status:       { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    duration:     { type: Number },
    defaultFacing: { type: String, enum: ['left', 'right'], default: 'right' },
    bilateralAudioProfile: { type: bilateralAudioProfileSchema, default: undefined },

    // Profile media
    imageProfile: { type: profileMediaSchema, default: null },
    videoProfile: { type: profileMediaSchema, default: null },
    musicProfile: { type: profileMediaSchema, default: null },

    uploadedBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

mediaSchema.index({ categoryId: 1, status: 1 });
mediaSchema.index({ categoryId: 1, createdAt: -1 });

export const Media = mongoose.model<IMedia>('Media', mediaSchema);
