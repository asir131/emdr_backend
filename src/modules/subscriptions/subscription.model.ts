import mongoose, { Schema, Document } from 'mongoose';

export enum SubscriptionPlanType {
  FREE = 'free',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  COMMUNITY = 'community',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export interface ISubscriptionPlan extends Document {
  name: string;
  type: SubscriptionPlanType;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  description: string;
  tagline: string;
  features: string[];
  spotsAvailable?: number;
  isActive: boolean;
  isCommunityAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  status: SubscriptionStatus;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionRequest extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name:         { type: String, required: true, trim: true },
    type:         { type: String, enum: Object.values(SubscriptionPlanType), default: SubscriptionPlanType.STANDARD },
    price:        { type: Number, required: true, default: 0 },
    currency:     { type: String, default: '£' },
    interval:     { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    description:  { type: String, trim: true },
    tagline:      { type: String, trim: true },
    features:     [{ type: String, trim: true }],
    spotsAvailable: { type: Number },
    isActive:     { type: Boolean, default: true },
    isCommunityAccess: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSubscriptionSchema = new Schema<IUserSubscription>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId:    { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    startDate: { type: Date, default: Date.now },
    endDate:   { type: Date },
    status:    { type: String, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.PENDING },
    autoRenew: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const subscriptionRequestSchema = new Schema<ISubscriptionRequest>(
  {
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId:       { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminComment: { type: String, trim: true },
  },
  { timestamps: true }
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
export const UserSubscription = mongoose.model<IUserSubscription>('UserSubscription', userSubscriptionSchema);
export const SubscriptionRequest = mongoose.model<ISubscriptionRequest>('SubscriptionRequest', subscriptionRequestSchema);
