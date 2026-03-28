import mongoose, { Schema, Document } from 'mongoose';

export interface ITermsAcceptance extends Document {
  userId: mongoose.Types.ObjectId;
  termsId: mongoose.Types.ObjectId;
  version: string;
  acceptedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const termsAcceptanceSchema = new Schema<ITermsAcceptance>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    termsId:   { type: Schema.Types.ObjectId, ref: 'Terms', required: true },
    version:   { type: String, required: true },
    acceptedAt: { type: Date, required: true, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: false }
);

termsAcceptanceSchema.index({ userId: 1, termsId: 1 }, { unique: true });
termsAcceptanceSchema.index({ userId: 1, acceptedAt: -1 });
termsAcceptanceSchema.index({ termsId: 1 });

export const TermsAcceptance = mongoose.model<ITermsAcceptance>('TermsAcceptance', termsAcceptanceSchema);
