import mongoose, { Schema, Document } from 'mongoose';

export interface IWatchTime extends Document {
  userId:       mongoose.Types.ObjectId;
  journeyId:    mongoose.Types.ObjectId;
  date:         string; // Format: YYYY-MM-DD
  totalSeconds: number;
  lastActive:   Date;
  createdAt:    Date;
  updatedAt:    Date;
}

const watchTimeSchema = new Schema<IWatchTime>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    journeyId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Journey', 
      required: true, 
      index: true 
    },
    date: { 
      type: String, 
      required: true, 
      index: true 
    },
    totalSeconds: { 
      type: Number, 
      default: 0 
    },
    lastActive: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);

// One record per user, per journey, per day
watchTimeSchema.index({ userId: 1, journeyId: 1, date: 1 }, { unique: true });

export const WatchTime = mongoose.model<IWatchTime>('WatchTime', watchTimeSchema);
