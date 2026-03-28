import mongoose, { Schema, Document } from 'mongoose';

export interface IPrivacySection {
  title: string;
  content: string;
  bullets?: string[];
  order: number;
}

export interface IPrivacyPolicy extends Document {
  version: string;
  overview: string;
  effectiveDate: Date;
  lastUpdated: Date;
  changelog?: string;
  sections: IPrivacySection[];
  contactEmail: string;
  contactName: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<IPrivacySection>(
  {
    title:   { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, required: true, trim: true },
    bullets: [{ type: String, trim: true }],
    order:   { type: Number, required: true },
  },
  { _id: false }
);

const privacySchema = new Schema<IPrivacyPolicy>(
  {
    version:       { type: String, required: true, trim: true },
    overview:      { type: String, required: true, trim: true },
    effectiveDate: { type: Date, required: true, default: Date.now },
    lastUpdated:   { type: Date, required: true, default: Date.now },
    changelog:     { type: String, trim: true },
    sections:      { type: [sectionSchema], required: true },
    contactEmail:  { type: String, required: true, trim: true, lowercase: true },
    contactName:   { type: String, required: true, trim: true },
    isActive:      { type: Boolean, default: true, index: true },
    createdBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

privacySchema.index({ isActive: 1 });
privacySchema.index({ createdAt: -1 });
privacySchema.index({ effectiveDate: -1 });

export const PrivacyPolicy = mongoose.model<IPrivacyPolicy>('PrivacyPolicy', privacySchema);
