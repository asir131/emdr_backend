import { User } from '../auth/auth.model';
import { ApiError } from '../../utils/ApiError';
import { redis, CACHE_TTL } from '../../config/redis';
import { logger } from '../../config/logger';
import bcrypt from 'bcryptjs';
import { sendPasswordChangedEmail } from '../../utils/sendEmail';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/uploadImage';

const profileCacheKey = (userId: string) => `profile:${userId}`;

export class ProfileService {

  // GET profile — Redis cached
  async getProfile(userId: string) {
    const cacheKey = profileCacheKey(userId);

    // Try cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      logger.warn('Redis cache read failed, falling back to DB', { userId });
    }

    const user = await User.findOne({ _id: userId, isDeleted: false }).select(
      'firstName lastName email phoneNumber avatar isVerified isProfileCompleted authProvider role createdAt'
    ).lean();

    if (!user) throw ApiError.userNotFound();

    const profile = {
      id: user._id.toString(),
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phoneNumber: user.phoneNumber ?? null,
      avatar: user.avatar ?? null,
      isVerified: user.isVerified,
      isProfileCompleted: user.isProfileCompleted,
      authProvider: user.authProvider,
      role: user.role,
      memberSince: user.createdAt,
    };

    // Cache the result
    try {
      await redis.setex(cacheKey, CACHE_TTL.PROFILE, JSON.stringify(profile));
    } catch (err) {
      logger.warn('Redis cache write failed', { userId });
    }

    return profile;
  }

  // EDIT profile — fullName + optional phoneNumber + optional profilePic
  async updateProfile(userId: string, fullName: string, phoneNumber?: string, profilePicBuffer?: Buffer) {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || parts[0];

    const updateData: Record<string, unknown> = {
      firstName,
      lastName,
      isProfileCompleted: true,
    };
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    // Upload new profile picture if provided
    if (profilePicBuffer) {
      const existing = await User.findById(userId).select('avatar').lean();
      const avatarUrl = await uploadToCloudinary(
        profilePicBuffer,
        'my-emdr/avatars',
        `avatar_${userId}`
      );
      updateData.avatar = avatarUrl;
      // Delete old image — non-blocking
      if (existing?.avatar) {
        deleteFromCloudinary(existing.avatar).catch(() => {});
      }
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    ).select('firstName lastName email phoneNumber avatar isVerified isProfileCompleted').lean();

    if (!user) throw ApiError.userNotFound();

    const profile = {
      id: user._id.toString(),
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phoneNumber: user.phoneNumber ?? null,
      profilePic: user.avatar ?? null,
      isVerified: user.isVerified,
      isProfileCompleted: user.isProfileCompleted,
    };

    // Invalidate cache
    try {
      await redis.del(profileCacheKey(userId));
    } catch (err) {
      logger.warn('Redis cache invalidation failed', { userId });
    }

    return profile;
  }

  // CHANGE PASSWORD — verify current, hash new, invalidate cache
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Must fetch password (select: false in schema)
    const user = await User.findOne({ _id: userId, isDeleted: false }).select('+password');
    if (!user) throw ApiError.userNotFound();

    // Google-only accounts have no real password
    if (user.authProvider === 'google' && !user.password) {
      throw ApiError.validationError(
        'This account uses Google Sign-In. Please use "Forgot Password" to set a password.'
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw ApiError.validationError('Current password is incorrect', 'currentPassword');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    // Invalidate all sessions — force re-login on other devices
    user.refreshToken = undefined;
    await user.save();

    // Clear auth cache so middleware re-checks
    try {
      await redis.del(`auth:check:${userId}`);
    } catch {
      logger.warn('Redis cache clear failed on password change', { userId });
    }

    // Send security alert email — non-blocking, failure won't affect response
    sendPasswordChangedEmail(user.email, user.firstName).catch(err =>
      logger.error('Password change email failed', { userId, error: err.message })
    );

    return { message: 'Password updated successfully' };
  }

  // SOFT DELETE — clear cache + session + FCM
  async deleteAccount(userId: string) {    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        refreshToken: undefined,
        fcmToken: undefined,
        fcmPlatform: undefined,
      },
      { new: true }
    );

    if (!user) throw ApiError.userNotFound();

    // Clear all caches for this user
    try {
      await redis.del(profileCacheKey(userId));
      await redis.del(`auth:check:${userId}`);
    } catch (err) {
      logger.warn('Redis cache clear failed on delete', { userId });
    }

    return { message: 'Account deleted successfully' };
  }
}

export const profileService = new ProfileService();
