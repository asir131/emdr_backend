import mongoose, { Schema, Document } from 'mongoose';

export type MediaStatus = 'active' | 'inactive';
export type MediaType = 'image' | 'video' | 'audio' | 'raw';

export interface IMedia extends Document {
  categoryId:    mongoose.Types.ObjectId;
  name:          string;
  url:           string;
  publicId:      string;
  mediaType:     MediaType;
  originalName:  string;
  size:          number;
  duration?:     number;

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
