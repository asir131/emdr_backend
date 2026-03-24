import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:    { type: String, required: true, trim: true },
    body:     { type: String, required: true, trim: true },
    data:     { type: Map, of: String },
    imageUrl: { type: String },
    isRead:   { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
