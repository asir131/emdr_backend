import mongoose, { Schema, Document } from 'mongoose';

export interface IAboutUs extends Document {
  aboutUs: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const aboutUsSchema = new Schema<IAboutUs>(
  {
    aboutUs:   { type: String, required: true, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AboutUs = mongoose.model<IAboutUs>('AboutUs', aboutUsSchema);
