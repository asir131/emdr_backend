import mongoose from 'mongoose';
import { env } from './env';

class Database {
  async connect(): Promise<void> {
    try {
      await mongoose.connect(env.DATABASE_URL, {
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
      });

      console.log('MongoDB connected successfully');

      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
      });

      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('MongoDB disconnected gracefully');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  getConnection() {
    return mongoose.connection;
  }
}

export const database = new Database();
export default database;
