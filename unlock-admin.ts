import mongoose from 'mongoose';
import { User } from './src/modules/auth/auth.model';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

async function unlockAdmin() {
    try {
        const uri = process.env.DATABASE_URL;
        if (!uri) throw new Error('DATABASE_URL is not defined in .env');

        await mongoose.connect(uri);
        console.log('Connected to DB');

        const user = await User.findOneAndUpdate(
            { email: 'admin@myemdr.com' },
            { 
                $set: { loginAttempts: 0 },
                $unset: { lockUntil: "" }
            },
            { new: true }
        );

        if (user) {
            console.log('Admin account unlocked successfully');
        } else {
            console.log('Admin user not found');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error unlocking admin:', error);
    }
}

unlockAdmin();
