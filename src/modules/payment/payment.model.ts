import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  subscriptionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId:                 { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId:                 { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    stripePaymentIntentId:  { type: String, required: true, unique: true },
    stripeCustomerId:       { type: String },
    amount:                 { type: Number, required: true },
    currency:               { type: String, default: 'gbp' },
    status:                 { type: String, enum: ['pending', 'succeeded', 'failed', 'canceled', 'refunded'], default: 'pending' },
    description:            { type: String },
    subscriptionId:         { type: Schema.Types.ObjectId, ref: 'UserSubscription' },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
