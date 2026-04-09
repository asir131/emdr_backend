import mongoose, { Schema, Document } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question:  { type: String, required: true, trim: true, maxlength: 300 },
    answer:    { type: String, required: true, trim: true, maxlength: 5000 },
    order:     { type: Number, default: 0, index: true },
    isActive:  { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

faqSchema.index({ isActive: 1, order: 1 });
faqSchema.index({ createdAt: -1 });

export const FAQ = mongoose.model<IFAQ>('FAQ', faqSchema);
