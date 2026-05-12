import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, IUser } from './auth.model';
import { ApiError } from '../../utils/ApiError';
import { generateOTP, getOTPExpiry, hashOTP, verifyOTP, isOTPExpired } from '../../utils/otp';
import { generateTokenPair, TokenPair, generateAccessToken, generateRefreshToken, verifyToken, JWTPayload } from '../../utils/jwt';
import { sendOTPEmail, sendPasswordResetEmail } from '../../utils/sendEmail';
import { verifyGoogleToken } from '../../utils/verifyGoogleToken';
import { env } from '../../config/env';
import { UserSubscription, SubscriptionStatus } from '../subscriptions/subscription.model';
import { SessionProgress } from '../progress/sessionProgress.model';
import { logger } from '../../config/logger';

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAcceptPrivacyStatement: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface SignupResponse {
  message: string;
  email: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    authProvider: string;
    isProfileCompleted: boolean;
    isAcceptPrivacyStatement: boolean;
  };
  session: TokenPair;
  _dev_otp?: string;
}

interface LoginResponse {
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isVerified: boolean;
    SubscriptionPlan: string;
    youSession: string;
  };
  session: TokenPair;
}

export class AuthService {
  private async getExtraUserData(userId: mongoose.Types.ObjectId) {
    // Check active subscription first
    const activeSub = await UserSubscription.findOne({ userId, status: SubscriptionStatus.ACTIVE })
      .populate('planId', 'name type')
      .lean();

    let SubscriptionPlan = 'No Plan';

    if (activeSub && (activeSub.planId as any)?.name) {
      // Active paid/community plan
      SubscriptionPlan = (activeSub.planId as any).name;
    } else {
      // Check pending (applied, awaiting admin approval)
      const pendingSub = await UserSubscription.findOne({ userId, status: SubscriptionStatus.PENDING })
        .populate('planId', 'name type')
        .lean();

      if (pendingSub && (pendingSub.planId as any)?.name) {
        SubscriptionPlan = `${(pendingSub.planId as any).name} (Pending Approval)`;
      }
      // else → 'No Plan' (user hasn't applied yet)
    }

    // Get Session Stats
    const sessionStats = await SessionProgress.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalCompleted: { $sum: '$completedSessions' } } },
    ]);
    const youSession = sessionStats.length > 0 ? sessionStats[0].totalCompleted.toString() : '0';

    return { SubscriptionPlan, youSession };
  }

  async signup(data: SignupData): Promise<SignupResponse> {
    const { firstName, lastName, email, password, isAcceptPrivacyStatement } = data;

    const existingUser = await User.findOne({ email }).select('+otp +otpExpiresAt +otpAttempts');

    if (existingUser) {
      if (existingUser.isVerified) {
        throw ApiError.emailAlreadyExists();
      }
      return this.resendOTP(existingUser);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);
    const otpExpiresAt = getOTPExpiry();

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      authProvider: 'email',
      isVerified: false,
      isProfileCompleted: false,
      isAcceptPrivacyStatement,
      privacyAcceptedAt: isAcceptPrivacyStatement ? new Date() : undefined,
      otp: hashedOtp,
      otpExpiresAt,
      otpAttempts: 0,
    });

    try {
      await sendOTPEmail(email, otp, firstName);
    } catch (error: any) {
      console.error('❌ OTP email failed:', error?.message || error);
      await User.findByIdAndDelete(user._id);
      throw ApiError.internalError('Failed to send verification email. Please try again.');
    }

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      isVerified: user.isVerified,
    };

    const tokens = generateTokenPair(tokenPayload);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    const response: SignupResponse = {
      message: 'Registration successful. Please verify your email with the OTP sent.',
      email: user.email,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        authProvider: user.authProvider,
        isProfileCompleted: user.isProfileCompleted,
        isAcceptPrivacyStatement: user.isAcceptPrivacyStatement,
      },
      session: tokens,
    };

    if (env.NODE_ENV === 'development') {
      response._dev_otp = otp;
    }

    return response;
  }

  private async resendOTP(user: IUser): Promise<SignupResponse> {
    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);
    const otpExpiresAt = getOTPExpiry();

    user.otp = hashedOtp;
    user.otpExpiresAt = otpExpiresAt;
    user.otpAttempts = 0;
    await user.save();

    await sendOTPEmail(user.email, otp, user.firstName);

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      isVerified: user.isVerified,
    };

    const tokens = generateTokenPair(tokenPayload);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    const response: SignupResponse = {
      message: 'Registration successful. Please verify your email with the OTP sent.',
      email: user.email,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        authProvider: user.authProvider,
        isProfileCompleted: user.isProfileCompleted,
        isAcceptPrivacyStatement: user.isAcceptPrivacyStatement,
      },
      session: tokens,
    };

    if (env.NODE_ENV === 'development') {
      response._dev_otp = otp;
    }

    return response;
  }


  async verifyOTP(email: string, otp: string): Promise<{ message: string; user: any }> {
    const user = await User.findOne({ email }).select('+otp +otpExpiresAt +otpAttempts');

    if (!user) {
      throw ApiError.userNotFound();
    }

    if (user.isVerified) {
      throw ApiError.validationError('Email is already verified');
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw ApiError.validationError('No OTP found. Please request a new one');
    }

    if (isOTPExpired(user.otpExpiresAt)) {
      throw ApiError.otpExpired();
    }

    if (user.otpAttempts >= 5) {
      throw ApiError.otpAttemptsExceeded();
    }

    const isValid = verifyOTP(otp, user.otp);

    if (!isValid) {
      user.otpAttempts += 1;
      await user.save();
      throw ApiError.otpInvalid();
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();

    const { SubscriptionPlan, youSession } = await this.getExtraUserData(user._id);

    return {
      message: "Email verified successfully.",
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
        authProvider: user.authProvider,
        isProfileCompleted: user.isProfileCompleted,
        SubscriptionPlan,
        youSession,
      },
    };
  }

  // RESEND OTP
  async resendOTPRequest(email: string): Promise<{ message: string; accessToken: string; _dev_otp?: string }> {
    const user = await User.findOne({ email }).select('+otp +otpExpiresAt +otpAttempts');

    if (!user) {
      throw ApiError.userNotFound();
    }

    if (user.isVerified) {
      throw ApiError.validationError('Email is already verified');
    }

    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);
    const otpExpiresAt = getOTPExpiry();

    user.otp = hashedOtp;
    user.otpExpiresAt = otpExpiresAt;
    user.otpAttempts = 0;
    await user.save();

    await sendOTPEmail(user.email, otp, user.firstName);

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      isVerified: user.isVerified,
    };

    const accessToken = generateAccessToken(tokenPayload);

    const response: { message: string; accessToken: string; _dev_otp?: string } = {
      message: 'OTP sent successfully to your email',
      accessToken: accessToken,
    };

    if (env.NODE_ENV === 'development') {
      response._dev_otp = otp;
    }

    return response;
  }

  // LOGIN 
  async login(data: LoginData): Promise<LoginResponse> {
    const { email, password } = data;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.isDeleted) {
      throw ApiError.unauthorized('This account has been deleted');
    }

    if (!user.isVerified) {
      throw ApiError.validationError('Please verify your email first');
    }


    if (user.lockUntil && user.lockUntil > new Date()) {
      throw ApiError.tooManyRequests('Account locked. Try again later');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();
      throw ApiError.unauthorized('Invalid email or password');
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      isVerified: user.isVerified,
    };

    const tokens = generateTokenPair(tokenPayload);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    // Get Subscription Plan
    const { SubscriptionPlan, youSession } = await this.getExtraUserData(user._id);

    return {
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        SubscriptionPlan,
        youSession,
      },
      session: tokens,
    };
  }

  // FORGOT PASSWORD
  async forgotPassword(email: string): Promise<{ message: string; session: TokenPair; _dev_otp?: string }> {
    const user = await User.findOne({ email }).select('+recoveryOtp +recoveryOtpExpiresAt +recoveryOtpAttempts');

    if (!user) {

      const dummyPayload = {
        userId: 'dummy',
        role: 'user',
        isVerified: false,
      };
      const dummyTokens = generateTokenPair(dummyPayload);
      
      return {
        message: 'OTP sent to your email for password reset.',
        session: dummyTokens,
      };
    }

    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);
    const otpExpiresAt = getOTPExpiry();

    user.recoveryOtp = hashedOtp;
    user.recoveryOtpExpiresAt = otpExpiresAt;
    user.recoveryOtpAttempts = 0;
    await user.save();

    await sendPasswordResetEmail(user.email, otp, user.firstName);

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      isVerified: user.isVerified,
    };

    const tokens = generateTokenPair(tokenPayload);

    const response: { message: string; session: TokenPair; _dev_otp?: string } = {
      message: 'OTP sent to your email for password reset.',
      session: tokens,
    };

    if (env.NODE_ENV === 'development') {
      response._dev_otp = otp;
    }

    return response;
  }

  // RECOVER ACCOUNT 
  async recoverAccount(userId: string, newPassword: string): Promise<{ message: string }> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.userNotFound();
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return {
      message: 'Password reset successfully.',
    };
  }

  // RECOVER ACCOUNT WITH OTP 
  //  SEND VERIFICATION OTP 
  async sendVerificationOTP(email: string, otp?: string): Promise<{ message: string; accessToken?: string; _dev_otp?: string }> {
    const user = await User.findOne({ email }).select('+recoveryOtp +recoveryOtpExpiresAt +recoveryOtpAttempts +password');

    if (!user) {
      throw ApiError.userNotFound();
    }


    if (otp) {
      if (!user.recoveryOtp || !user.recoveryOtpExpiresAt) {
        throw ApiError.validationError('No recovery OTP found. Please request a new one');
      }

      if (isOTPExpired(user.recoveryOtpExpiresAt)) {
        throw ApiError.otpExpired();
      }

      if (user.recoveryOtpAttempts >= 5) {
        throw ApiError.otpAttemptsExceeded();
      }

      const isValid = verifyOTP(otp, user.recoveryOtp);

      if (!isValid) {
        user.recoveryOtpAttempts += 1;
        await user.save();
        throw ApiError.otpInvalid();
      }

      const accessToken = generateAccessToken({ userId: user._id.toString(), role: user.role, isVerified: user.isVerified });
      const refreshToken = generateRefreshToken({ userId: user._id.toString(), role: user.role, isVerified: user.isVerified });
      const hashedRefreshToken = hashOTP(refreshToken);

      user.refreshToken = hashedRefreshToken;
      user.recoveryOtpAttempts = 0;
      await user.save();

      return {
        message: 'OTP verified successfully. You can now reset your password.',
        accessToken,
      };
    }

    const newOtp = generateOTP();
    const hashedOtp = hashOTP(newOtp);
    const otpExpiresAt = getOTPExpiry();

    user.recoveryOtp = hashedOtp;
    user.recoveryOtpExpiresAt = otpExpiresAt;
    user.recoveryOtpAttempts = 0;
    await user.save();

    await sendPasswordResetEmail(user.email, newOtp, user.firstName);

    return {
      message: 'OTP sent to your email for password reset.',
      _dev_otp: newOtp,
    };
  }

  // VERIFY EMAIL WITH TOKEN
  async verifyEmailWithToken(userId: string, otp: string): Promise<{ message: string; user: any }> {
    const user = await User.findById(userId).select('+otp +otpExpiresAt +otpAttempts');

    if (!user) {
      throw ApiError.userNotFound();
    }

    if (user.isVerified) {
      throw ApiError.validationError('Email is already verified');
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw ApiError.validationError('No OTP found. Please request a new one');
    }

    if (isOTPExpired(user.otpExpiresAt)) {
      throw ApiError.otpExpired();
    }

    if (user.otpAttempts >= 5) {
      throw ApiError.otpAttemptsExceeded();
    }

    const isValid = verifyOTP(otp, user.otp);

    if (!isValid) {
      user.otpAttempts += 1;
      await user.save();
      throw ApiError.otpInvalid();
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();

    const { SubscriptionPlan, youSession } = await this.getExtraUserData(user._id);

    return {
      message: 'Email verified successfully',
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
        authProvider: user.authProvider,
        isProfileCompleted: user.isProfileCompleted,
        SubscriptionPlan,
        youSession,
      },
    };
  }

  // LOGOUT
  async logout(userId: string, refreshToken: string): Promise<{ message: string }> {
    if (!refreshToken) {
      throw ApiError.validationError('Refresh token is required');
    }

    const user = await User.findById(userId).select('+refreshToken');

    if (!user) {
      throw ApiError.userNotFound();
    }

    if (!user.refreshToken) {
      throw ApiError.validationError('No active session found');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isValid) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    user.refreshToken = undefined;
    await user.save();

    return {
      message: 'Logged out successfully',
    };
  }

  // GOOGLE AUTH
  async googleAuth(idToken: string): Promise<{ message: string; isNewUser: boolean; user: any; session: TokenPair }> {
    const googleUser = await verifyGoogleToken(idToken);

    let user = await User.findOne({
      $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
    });

    const isNewUser = !user;

    if (user) {
      const needsUpdate = !user.googleId || !user.isVerified;
      if (needsUpdate) {
        user.googleId    = user.googleId    || googleUser.googleId;
        user.avatar      = user.avatar      || googleUser.avatar;
        user.isVerified  = true;
        user.authProvider = user.authProvider === 'email' ? 'email' : 'google';
        await user.save();
      }
    } else {
      user = await User.create({
        googleId:           googleUser.googleId,
        firstName:          googleUser.firstName,
        lastName:           googleUser.lastName,
        email:              googleUser.email,
        avatar:             googleUser.avatar,
        authProvider:       'google',
        isVerified:         true,
        isProfileCompleted: false,
        password:           await bcrypt.hash(Math.random().toString(36), 10), // placeholder
      });
    }

    const payload = { userId: user._id.toString(), role: user.role, isVerified: user.isVerified };
    const tokens  = generateTokenPair(payload);
    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    user.lastLogin    = new Date();
    await user.save();

    const { SubscriptionPlan, youSession } = await this.getExtraUserData(user._id);

    return {
      message:   isNewUser ? 'Account created successfully via Google' : 'Login successful via Google',
      isNewUser,
      user: {
        id:                 user._id.toString(),
        firstName:          user.firstName,
        lastName:           user.lastName,
        email:              user.email,
        avatar:             user.avatar,
        authProvider:       user.authProvider,
        isVerified:         user.isVerified,
        isProfileCompleted: user.isProfileCompleted,
        role:               user.role,
        SubscriptionPlan,
        youSession,
      },
      session: tokens,
    };
  }

  // REFRESH ACCESS TOKEN
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    if (!refreshToken) {
      throw ApiError.validationError('Refresh token is required');
    }

    let decoded: JWTPayload;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user) {
      throw ApiError.userNotFound();
    }

    if (!user.refreshToken) {
      throw ApiError.unauthorized('No active session found');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isValid) {
      user.refreshToken = undefined;
      await user.save();
      throw ApiError.unauthorized('Token reuse detected. Please login again.');
    }

    const payload: JWTPayload = {
      userId: user._id.toString(),
      role: user.role,
      isVerified: user.isVerified,
    };

    const newAccessToken = generateAccessToken(payload);

    const ENABLE_REFRESH_TOKEN_ROTATION = env.NODE_ENV === 'production';

    if (ENABLE_REFRESH_TOKEN_ROTATION) {
      const newRefreshToken = generateRefreshToken(payload);
      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

      user.refreshToken = hashedRefreshToken;
      await user.save();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    }

    return {
      accessToken: newAccessToken,
    };
  }
}

export const authService = new AuthService();
