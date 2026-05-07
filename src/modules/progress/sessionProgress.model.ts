import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionProgress extends Document {
  userId:             mongoose.Types.ObjectId;
  journeyId:          mongoose.Types.ObjectId;
  totalSessions:      number;
  completedSessions:  number;
  progressPercentage: string; // e.g. "49%"
  createdAt:          Date;
  updatedAt:          Date;
}

const sessionProgressSchema = new Schema<ISessionProgress>(
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
    totalSessions: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    completedSessions: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    progressPercentage: { 
      type: String, 
      required: true 
    },
  },
  { timestamps: true }
);

// One progress record per user per journey
sessionProgressSchema.index({ userId: 1, journeyId: 1 }, { unique: true });

// IMPORTANT: If you're getting duplicate key errors on userId field,
// you need to drop the old userId_1 index from MongoDB:
// db.sessionprogresses.dropIndex("userId_1")

export const SessionProgress = mongoose.model<ISessionProgress>('SessionProgress', sessionProgressSchema);
