import mongoose, { Schema, Document } from 'mongoose';

export type MediaStatus = 'active' | 'inactive';
export type MediaType = 'image' | 'video' | 'audio';

export interface IMedia extends Document {
  categoryId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  publicId: string;
  mediaType: MediaType;
  originalName: string;
  size: number;
  status: MediaStatus;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    categoryId:   { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name:         { type: String, required: [true, 'Name is required'], trim: true, maxlength: 200 },
    url:          { type: String, required: true },
    publicId:     { type: String, required: true, select: false },
    mediaType:    { type: String, enum: ['image', 'video', 'audio'], required: true },
    originalName: { type: String, trim: true },
    size:         { type: Number },
    status:       { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    uploadedBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

mediaSchema.index({ categoryId: 1, status: 1 });
mediaSchema.index({ categoryId: 1, createdAt: -1 });

export const Media = mongoose.model<IMedia>('Media', mediaSchema);
