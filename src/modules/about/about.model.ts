import mongoose, { Schema, Document } from 'mongoose';

export interface IAboutUsSection {
  title: string;
  content: string;
  order: number;
}

export interface IAboutUs extends Document {
  overview: string;
  sections: IAboutUsSection[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<IAboutUsSection>(
  {
    title:   { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, required: true, trim: true },
    order:   { type: Number, required: true },
  },
  { _id: false }
);

const aboutUsSchema = new Schema<IAboutUs>(
  {
    overview: { type: String, required: true, trim: true },
    sections: { type: [sectionSchema], required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AboutUs = mongoose.model<IAboutUs>('AboutUs', aboutUsSchema);
