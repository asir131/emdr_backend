import mongoose, { Schema, Document } from 'mongoose';

export type BilateralItemType = 'environment' | 'object' | 'sound';

export interface IBilateralItem extends Document {
  type:      BilateralItemType;
  name:      string;
  fileUrl:   string;       // imageUrl / iconUrl / audioUrl — unified
  publicId?: string;       // Cloudinary public_id (hidden)
  isActive:  boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const bilateralItemSchema = new Schema<IBilateralItem>(
  {
    type:      { type: String, enum: ['environment', 'object', 'sound'], required: true, index: true },
    name:      { type: String, required: true, trim: true, maxlength: 100 },
    fileUrl:   { type: String, required: true },
    publicId:  { type: String, select: false },
    isActive:  { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bilateralItemSchema.index({ type: 1, isActive: 1, sortOrder: 1 });

export const BilateralItem = mongoose.model<IBilateralItem>('BilateralItem', bilateralItemSchema);

// ── User Settings ─────────────────────────────────────────────────────────
export type DirectionType = 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up';
export type SpeedType     = 'slow' | 'medium' | 'fast';

export interface IUserBilateralSettings extends Document {
  userId:         mongoose.Types.ObjectId;
  environmentId:  string;   // image URL
  iconUrl:        string;   // icon URL
  soundId:        string;   // audio URL
  direction:      DirectionType;
  speed:          SpeedType;
  updatedAt:      Date;
}

const userSettingsSchema = new Schema<IUserBilateralSettings>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    environmentId: { type: String, required: true },
    iconUrl:       { type: String, required: true },
    soundId:       { type: String, required: true },
    direction:     { type: String, enum: ['horizontal', 'vertical', 'diagonal-down', 'diagonal-up'], default: 'horizontal' },
    speed:         { type: String, enum: ['slow', 'medium', 'fast'], default: 'medium' },
  },
  { timestamps: true }
);

export const UserBilateralSettings = mongoose.model<IUserBilateralSettings>('UserBilateralSettings', userSettingsSchema);
