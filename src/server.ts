import app from './app';
import { env } from './config/env';
import database from './config/database';

const startServer = async () => {
  try {
    await database.connect();
    console.log('✅ Database connected successfully');

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  await database.disconnect();
  process.exit(0);
});
