import { User } from '../auth/auth.model';
import { Notification } from './notification.model';
import { sendToToken, sendToTopic, NotificationPayload } from '../../utils/sendNotification';
import { ApiError } from '../../utils/ApiError';
import { getNotificationQueue } from '../../config/queue';
import { logger } from '../../config/logger';

export const notificationService = {

  async registerToken(userId: string, fcmToken: string, platform: string) {
    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { fcmToken, fcmPlatform: platform },
      { returnDocument: 'after' }
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
    if (!user.fcmToken) throw new ApiError(400, 'NO_FCM_TOKEN', 'User has no registered device token. Ask the user to log in from their device first.');

    let fcmResult;
    try {
      fcmResult = await sendToToken(user.fcmToken, payload);
    } catch (err: any) {
      const code: string = err?.errorInfo?.code ?? err?.code ?? '';

      // Token no longer registered (app uninstalled / token rotated)
      if (code === 'messaging/registration-token-not-registered') {
        await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1, fcmPlatform: 1 } });
        logger.warn('Stale FCM token removed', { userId });
        throw new ApiError(400, 'INVALID_FCM_TOKEN', 'Device token expired or unregistered. Token has been cleared — user must re-login from their device.');
      }

      // Token format is invalid (wrong string, test value, etc.)
      if (code === 'messaging/invalid-argument' || code === 'messaging/invalid-registration-token') {
        await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1, fcmPlatform: 1 } });
        logger.warn('Invalid FCM token cleared', { userId, code });
        throw new ApiError(400, 'INVALID_FCM_TOKEN', 'The stored device token is invalid. Token has been cleared — user must re-login from their device.');
      }

      // Firebase project misconfiguration
      if (code === 'messaging/mismatched-credential' || code === 'messaging/sender-id-mismatch') {
        logger.error('FCM credential mismatch — check Firebase project config', { code });
        throw new ApiError(500, 'FCM_CONFIG_ERROR', 'Firebase credential mismatch. Check server FCM configuration.');
      }

      // Any other FCM error — log and surface cleanly
      logger.error('FCM send failed', { userId, code, message: err?.message });
      throw new ApiError(502, 'FCM_SEND_FAILED', `Push notification failed: ${err?.message ?? 'Unknown FCM error'}`);
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

    const queue = getNotificationQueue();
    if (!queue) {
      logger.warn('Queue unavailable — broadcast skipped');
      return { queued: 0, message: 'Redis unavailable, broadcast not queued' };
    }

    await queue.add('broadcast', {
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
