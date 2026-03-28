import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  password: string;
  authProvider: 'email' | 'google' | 'facebook';
  isVerified: boolean;
  isProfileCompleted: boolean;
  role: 'user' | 'admin';
  otp?: string;
  otpExpiresAt?: Date;
  otpAttempts: number;
  recoveryOtp?: string;
  recoveryOtpExpiresAt?: Date;
  recoveryOtpAttempts: number;
  refreshToken?: string;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  googleId?: string;
  avatar?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  isAcceptPrivacyStatement: boolean;
  privacyAcceptedAt?: Date;
  fcmToken?: string;
  fcmPlatform?: 'android' | 'ios' | 'web';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [30, 'First name cannot exceed 30 characters'],
      match: [/^[a-zA-Z]+$/, 'First name can only contain letters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [30, 'Last name cannot exceed 30 characters'],
      match: [/^[a-zA-Z]+$/, 'Last name can only contain letters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'facebook'],
      default: 'email',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    recoveryOtp: {
      type: String,
      select: false,
    },
    recoveryOtpExpiresAt: {
      type: Date,
      select: false,
    },
    recoveryOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
      select: false,
    },
    fcmToken: { type: String, select: false },
    fcmPlatform: { type: String, enum: ['android', 'ios', 'web'], select: false },
    googleId: { type: String, sparse: true, index: true },
    avatar:   { type: String },
    phoneNumber: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    isAcceptPrivacyStatement: { type: Boolean, default: false },
    privacyAcceptedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);


userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 600 });

export const User = mongoose.model<IUser>('User', userSchema);
