import mongoose from 'mongoose';
import { env } from '../config/env';
import { CalmPlace } from '../modules/calm-place/calmPlace.model';

async function dropIndex() {
  try {
    await mongoose.connect(env.DATABASE_URL);
    console.log('Connected to database');
    
    await CalmPlace.collection.dropIndex('userId_1');
    console.log('Successfully dropped userId_1 index from CalmPlaces collection');
  } catch (error: any) {
    if (error.code === 27) {
      console.log('Index not found, ignoring.');
    } else {
      console.error('Error dropping index:', error.message);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

dropIndex();
