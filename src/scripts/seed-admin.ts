/**
 * Admin Seed Script
 * Run: npx tsx src/scripts/seed-admin.ts
 *
 * Creates a default admin account if one doesn't exist.
 * Credentials are read from environment variables.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

// ── Admin credentials — set these in .env ──────────────────
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME ?? 'Super';
const ADMIN_LAST_NAME  = process.env.ADMIN_LAST_NAME  ?? 'Admin';
const ADMIN_EMAIL      = process.env.ADMIN_EMAIL      ?? 'admin@myemdr.com';
const ADMIN_PASSWORD   = process.env.ADMIN_PASSWORD   ?? 'Admin@123456';

async function seedAdmin() {
  console.log('🔌 Connecting to database...');

  await mongoose.connect(env.DATABASE_URL, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });

  console.log('✅ Database connected');

  // Lazy import after DB connect to avoid model registration issues
  const { User } = await import('../modules/auth/auth.model.js');

  // Check if admin already exists
  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`⚠️  Admin already exists: ${ADMIN_EMAIL}`);
      console.log('   No changes made.');
    } else {
      // Upgrade existing user to admin
      existing.role = 'admin';
      existing.isVerified = true;
      await existing.save();
      console.log(`✅ Existing user upgraded to admin: ${ADMIN_EMAIL}`);
    }
    await mongoose.disconnect();
    return;
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(ADMIN_PASSWORD)) {
    console.error('❌ ADMIN_PASSWORD is too weak.');
    console.error('   Must contain: uppercase, lowercase, number, special character, min 8 chars.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await User.create({
    firstName:                ADMIN_FIRST_NAME,
    lastName:                 ADMIN_LAST_NAME,
    email:                    ADMIN_EMAIL,
    password:                 hashedPassword,
    role:                     'admin',
    authProvider:             'email',
    isVerified:               true,
    isProfileCompleted:       true,
    isAcceptPrivacyStatement: true,
    privacyAcceptedAt:        new Date(),
  });

  console.log('');
  console.log('✅ Admin account created successfully!');
  console.log('─────────────────────────────────────');
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log(`   Role     : admin`);
  console.log('─────────────────────────────────────');
  console.log('⚠️  Change the password after first login!');
  console.log('');

  await mongoose.disconnect();
  console.log('🔌 Database disconnected');
}

seedAdmin().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
