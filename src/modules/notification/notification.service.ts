import { User } from '../auth/auth.model';
import { Notification } from './notification.model';
import { sendToToken, sendToMultiple, sendToTopic, NotificationPayload } from '../../utils/sendNotification';
import { ApiError } from '../../utils/ApiError';

export const notificationService = {

  /** Save FCM token for authenticated user */
  async registerToken(userId: string, fcmToken: string, platform: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken, fcmPlatform: platform },
      { new: true, select: 'firstName email fcmToken' }
    );
    if (!user) throw ApiError.userNotFound();
    return user;
  },

  /** Remove FCM token on logout */
  async removeToken(userId: string) {
    await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1, fcmPlatform: 1 } });
  },

  /** Send notification to a specific user */
  async sendToUser(userId: string, payload: NotificationPayload) {
    const user = await User.findById(userId).select('fcmToken');
    if (!user) throw ApiError.userNotFound();
    if (!user.fcmToken) throw new ApiError(400, 'NO_FCM_TOKEN', 'User has no registered device');

    const [fcmResult, notification] = await Promise.all([
      sendToToken(user.fcmToken, payload),
      Notification.create({ userId, ...payload }),
    ]);

    return { fcmResult, notification };
  },

  /** Broadcast to all users (or filtered by role) */
  async broadcast(payload: NotificationPayload, role?: string) {
    const filter = role ? { fcmToken: { $exists: true }, role } : { fcmToken: { $exists: true } };
    const users = await User.find(filter).select('_id fcmToken');
    if (!users.length) return { sent: 0 };

    const tokens = users.map(u => u.fcmToken as string);
    const userIds = users.map(u => u._id);

    const [fcmResult] = await Promise.all([
      sendToMultiple(tokens, payload),
      Notification.insertMany(userIds.map(userId => ({ userId, ...payload }))),
    ]);

    return {
      sent: fcmResult?.successCount ?? 0,
      failed: fcmResult?.failureCount ?? 0,
    };
  },

  /** Send to a Firebase topic */
  async sendToTopic(topic: string, payload: NotificationPayload) {
    return sendToTopic(topic, payload);
  },

  /** Get paginated notifications for a user */
  async getMyNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);
    return { notifications, total, unreadCount, page, limit };
  },

  /** Mark one or all notifications as read */
  async markAsRead(userId: string, notificationId?: string) {
    const filter = notificationId ? { _id: notificationId, userId } : { userId, isRead: false };
    const { modifiedCount } = await Notification.updateMany(filter, { isRead: true });
    return { updated: modifiedCount };
  },

  /** Delete a notification */
  async deleteNotification(userId: string, notificationId: string) {
    const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
    if (!result) throw new ApiError(404, 'NOT_FOUND', 'Notification not found');
    return result;
  },
};
