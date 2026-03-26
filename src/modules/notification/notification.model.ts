import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:    { type: String, required: true, trim: true, maxlength: 100 },
    body:     { type: String, required: true, trim: true, maxlength: 500 },
    data:     { type: Map, of: String },
    imageUrl: { type: String },
    isRead:   { type: Boolean, default: false, index: true },
    readAt:   { type: Date },
  },
  { timestamps: true }
);

// Compound index for efficient per-user queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
