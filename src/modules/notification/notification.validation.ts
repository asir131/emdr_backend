import { z } from 'zod';

export const registerTokenSchema = z.object({
  body: z.object({
    fcmToken: z.string().min(10, 'Invalid FCM token'),
    platform: z.enum(['android', 'ios', 'web']),
  }),
});

export const sendToUserSchema = z.object({
  body: z.object({
    userId:   z.string().min(1),
    title:    z.string().min(1).max(100),
    body:     z.string().min(1).max(500),
    data:     z.record(z.string()).optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const broadcastSchema = z.object({
  body: z.object({
    title:    z.string().min(1).max(100),
    body:     z.string().min(1).max(500),
    role:     z.enum(['user', 'admin']).optional(),
    data:     z.record(z.string()).optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const topicSchema = z.object({
  body: z.object({
    topic:    z.string().min(1),
    title:    z.string().min(1).max(100),
    body:     z.string().min(1).max(500),
    data:     z.record(z.string()).optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page:  z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const markReadSchema = z.object({
  params: z.object({
    id: z.string().optional(),
  }),
});
