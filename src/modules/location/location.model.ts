import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  userId: mongoose.Types.ObjectId;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  sharedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    latitude:  { type: Number, required: true, min: -90,  max: 90  },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    accuracy:  { type: Number },   // meters
    address:   { type: String, trim: true },
    sharedAt:  { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Always get latest location fast
locationSchema.index({ userId: 1, sharedAt: -1 });

// Auto-delete location records older than 30 days
locationSchema.index({ sharedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Location = mongoose.model<ILocation>('Location', locationSchema);
