import { messaging } from '../config/firebase';
import { MulticastMessage } from 'firebase-admin/messaging';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/** Send to a single FCM token */
export const sendToToken = async (token: string, payload: NotificationPayload) => {
  const { title, body, data, imageUrl } = payload;
  return messaging.send({
    token,
    notification: { title, body, imageUrl },
    data,
    android: { priority: 'high', notification: { sound: 'default' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  });
};

/** Send to multiple FCM tokens (max 500 per call) */
export const sendToMultiple = async (tokens: string[], payload: NotificationPayload) => {
  if (!tokens.length) return null;
  const { title, body, data, imageUrl } = payload;
  const message: MulticastMessage = {
    tokens,
    notification: { title, body, imageUrl },
    data,
    android: { priority: 'high', notification: { sound: 'default' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  };
  return messaging.sendEachForMulticast(message);
};

/** Send to a Firebase topic */
export const sendToTopic = async (topic: string, payload: NotificationPayload) => {
  const { title, body, data, imageUrl } = payload;
  return messaging.send({
    topic,
    notification: { title, body, imageUrl },
    data,
    android: { priority: 'high', notification: { sound: 'default' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  });
};
