import { User } from '../auth/auth.model';
import { ApiError } from '../../utils/ApiError';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/uploadImage';

const CACHE_KEY = (id: string) => `admin:profile:${id}`;
const CACHE_TTL = 300; // 5 minutes

export const adminService = {

  // GET admin profile
  async getProfile(adminId: string) {
    try {
      const cached = await redis.get(CACHE_KEY(adminId));
      if (cached) return JSON.parse(cached);
    } catch {
      logger.warn('Redis read failed for admin profile cache', { adminId });
    }

    const admin = await User.findOne({ _id: adminId, role: 'admin', isDeleted: false })
      .select('firstName lastName email phoneNumber avatar role createdAt')
      .lean();

    if (!admin) throw ApiError.userNotFound();

    const profile = {
      id:          admin._id.toString(),
      name:        `${admin.firstName} ${admin.lastName}`.trim(),
      email:       admin.email,
      phoneNumber: admin.phoneNumber ?? null,
      profilePic:  admin.avatar ?? null,
      role:        admin.role,
      memberSince: admin.createdAt,
    };

    try {
      await redis.setex(CACHE_KEY(adminId), CACHE_TTL, JSON.stringify(profile));
    } catch {
      logger.warn('Redis write failed for admin profile cache', { adminId });
    }

    return profile;
  },

  // PATCH admin profile — name, phoneNumber, profilePic
  async updateProfile(adminId: string, data: { name: string; phoneNumber?: string }, profilePicBuffer?: Buffer) {
    const parts = data.name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName  = parts.slice(1).join(' ') || parts[0];

    const updateData: Record<string, unknown> = { firstName, lastName };
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;

    // Upload new profile picture if provided
    if (profilePicBuffer) {
      const existing = await User.findById(adminId).select('avatar').lean();
      const avatarUrl = await uploadToCloudinary(
        profilePicBuffer,
        'my-emdr/admin-avatars',
        `admin_avatar_${adminId}`
      );
      updateData.avatar = avatarUrl;
      if (existing?.avatar) {
        deleteFromCloudinary(existing.avatar).catch(() => {});
      }
    }

    const admin = await User.findOneAndUpdate(
      { _id: adminId, role: 'admin', isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    ).select('firstName lastName email phoneNumber avatar role').lean();

    if (!admin) throw ApiError.userNotFound();

    const profile = {
      id:          admin._id.toString(),
      name:        `${admin.firstName} ${admin.lastName}`.trim(),
      email:       admin.email,
      phoneNumber: admin.phoneNumber ?? null,
      profilePic:  admin.avatar ?? null,
      role:        admin.role,
    };

    // Invalidate cache
    try {
      await redis.del(CACHE_KEY(adminId));
    } catch {
      logger.warn('Redis cache invalidation failed for admin profile', { adminId });
    }

    logger.info('Admin profile updated', { adminId });
    return profile;
  },
};
