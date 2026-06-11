import { Queue, Worker, Job } from 'bullmq';
import { redis, redisAvailable } from './redis';
import { logger } from './logger';

export interface BroadcastJobData {
  tokens: string[];
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

let notificationQueue: Queue<BroadcastJobData> | null = null;
let worker: Worker | null = null;

export const getNotificationQueue = (): Queue<BroadcastJobData> | null => {
  if (!redisAvailable) return null;
  if (!notificationQueue) {
    notificationQueue = new Queue<BroadcastJobData>('notifications', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return notificationQueue;
};

export const startNotificationWorker = () => {
  if (!redisAvailable) {
    logger.warn('Redis unavailable — notification worker skipped');
    return;
  }

  worker = new Worker<BroadcastJobData>(
    'notifications',
    async (job: Job<BroadcastJobData>) => {
      const { tokens, userIds, title, body, data, imageUrl } = job.data;

      const { sendToMultiple } = await import('../utils/sendNotification.js');
      const { Notification } = await import('../modules/notification/notification.model.js');

      const BATCH = 500;
      let totalSent = 0;
      let totalFailed = 0;

      for (let i = 0; i < tokens.length; i += BATCH) {
        const batchTokens = tokens.slice(i, i + BATCH);
        const batchUserIds = userIds.slice(i, i + BATCH);

        const result = await sendToMultiple(batchTokens, { title, body, data, imageUrl });
        totalSent += result?.successCount ?? 0;
        totalFailed += result?.failureCount ?? 0;

        await Notification.insertMany(
          batchUserIds.map(userId => ({ userId, title, body, data, imageUrl }))
        );

        logger.debug(`Broadcast batch ${i / BATCH + 1}: sent=${totalSent} failed=${totalFailed}`);
      }

      return { sent: totalSent, failed: totalFailed };
    },
    { connection: redis, concurrency: 2 }
  );

  worker.on('completed', (job) =>
    logger.info('Broadcast job completed', { jobId: job.id, result: job.returnvalue })
  );
  worker.on('failed', (job, err) =>
    logger.error('Broadcast job failed', { jobId: job?.id, error: err.message })
  );

  logger.info('Notification worker started');
};
