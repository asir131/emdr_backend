import { User } from '../auth/auth.model';
import { Notification } from './notification.model';
import { sendToToken, sendToTopic, NotificationPayload } from '../../utils/sendNotification';
import { ApiError } from '../../utils/ApiError';
import { notificationQueue } from '../../config/queue';
import { logger } from '../../config/logger';

export const notificationService = {

  async registerToken(userId: string, fcmToken: string, platform: string) {
    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { fcmToken, fcmPlatform: platform },
      { new: true }
    ).select('firstName email fcmToken');

    if (!user) throw ApiError.userNotFound();
    return user;
  },

  async removeToken(userId: string) {
    await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { $unset: { fcmToken: 1, fcmPlatform: 1 } }
    );
  },

  async sendToUser(userId: string, payload: NotificationPayload) {
    const user = await User.findOne({ _id: userId, isDeleted: false }).select('fcmToken').lean();
    if (!user) throw ApiError.userNotFound();
    if (!user.fcmToken) throw new ApiError(400, 'NO_FCM_TOKEN', 'User has no registered device');

    let fcmResult;
    try {
      fcmResult = await sendToToken(user.fcmToken, payload);
    } catch (err: any) {
      // FCM token invalid — clean it up automatically
      if (err?.errorInfo?.code === 'messaging/registration-token-not-registered') {
        await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1, fcmPlatform: 1 } });
        logger.warn('Stale FCM token removed', { userId });
        throw new ApiError(400, 'NO_FCM_TOKEN', 'Device token expired. Please re-register.');
      }
      throw err;
    }

    const notification = await Notification.create({ userId, ...payload });
    return { fcmResult, notification };
  },

  // Broadcast via BullMQ queue — non-blocking, handles 100k+ users
  async broadcast(payload: NotificationPayload, role?: string) {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      fcmToken: { $exists: true, $ne: null },
    };
    if (role) filter.role = role;

    const users = await User.find(filter).select('_id fcmToken').lean();
    if (!users.length) return { queued: 0, message: 'No eligible users' };

    const tokens = users.map(u => u.fcmToken as string);
    const userIds = users.map(u => u._id.toString());

    await notificationQueue.add('broadcast', {
      tokens,
      userIds,
      ...payload,
    });

    logger.info('Broadcast job queued', { recipients: users.length, role: role ?? 'all' });
    return { queued: users.length, message: 'Broadcast queued successfully' };
  },

  async sendToTopic(topic: string, payload: NotificationPayload) {
    return sendToTopic(topic, payload);
  },

  async getMyNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    };
  },

  async markAsRead(userId: string, notificationId?: string) {
    const filter = notificationId
      ? { _id: notificationId, userId }
      : { userId, isRead: false };

    const { modifiedCount } = await Notification.updateMany(filter, {
      isRead: true,
      readAt: new Date(),
    });
    return { updated: modifiedCount };
  },

  async deleteNotification(userId: string, notificationId: string) {
    const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
    if (!result) throw ApiError.notFound('Notification not found');
    return result;
  },
};
