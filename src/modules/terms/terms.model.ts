import mongoose, { Schema, Document } from 'mongoose';

export interface ISection {
  title: string;
  content: string;
  bullets?: string[];
  order: number;
}

export interface ITerms extends Document {
  version: string;
  lastUpdated: Date;
  effectiveDate: Date;
  changelog?: string;
  sections: ISection[];
  contactEmail: string;
  contactName: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<ISection>(
  {
    title:   { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, required: true, trim: true },
    bullets: [{ type: String, trim: true }],
    order:   { type: Number, required: true },
  },
  { _id: false }
);

const termsSchema = new Schema<ITerms>(
  {
    version:       { type: String, required: true, trim: true },
    lastUpdated:   { type: Date, required: true, default: Date.now },
    effectiveDate: { type: Date, required: true, default: Date.now },
    changelog:     { type: String, trim: true }, // what changed in this version
    sections:      { type: [sectionSchema], required: true },
    contactEmail:  { type: String, required: true, trim: true, lowercase: true },
    contactName:   { type: String, required: true, trim: true },
    isActive:      { type: Boolean, default: true, index: true },
    createdBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

termsSchema.index({ isActive: 1 });
termsSchema.index({ createdAt: -1 });
termsSchema.index({ effectiveDate: -1 });

export const Terms = mongoose.model<ITerms>('Terms', termsSchema);
