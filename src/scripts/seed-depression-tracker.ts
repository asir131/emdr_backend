import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { env } from '../config/env';
import { SymptomTrackerConfig } from '../modules/symptom-tracker/symptomTracker.model';
import { User } from '../modules/auth/auth.model';

const DEPRESSION_TRACKER = {
  trackerType: 'depression',
  name       : 'Depression',
  description: 'A brief check-in on mood, energy, and the texture of daily life over the past week.',
  items: [
    { text: "A heaviness or flatness has sat with me through the day.", reverse: false },
    { text: "The things that usually pull me in have felt dull or pointless.", reverse: false },
    { text: "I have moved through the day with little fuel.", reverse: false },
    { text: "I have judged myself harshly or felt fundamentally bad.", reverse: false },
    { text: "My thinking has felt sluggish, foggy, or hard to direct.", reverse: false },
    { text: "I have felt that the future holds something good.", reverse: true },
    { text: "My sleep has been off — too little, too much, or restless.", reverse: false },
    { text: "My relationship to food has shifted noticeably.", reverse: false },
    { text: "I have felt either weighted down or restless and unable to settle.", reverse: false },
    { text: "I have had thoughts about not being here, or about ending things.", reverse: false }
  ],
  options: [
    { value: 0, label: "Never" },
    { value: 1, label: "Rarely" },
    { value: 2, label: "Sometimes" },
    { value: 3, label: "Often" },
    { value: 4, label: "Almost always" }
  ],
  bands: [
    { max: 9, label: "Minimal", description: "Few symptoms of low mood reported in the past week. This is within the range commonly experienced in everyday life." },
    { max: 17, label: "Mild", description: "Some signs of low mood present. These may be noticeable to you but are unlikely to be substantially disrupting daily functioning. Worth tracking week to week as you work through the programme." },
    { max: 25, label: "Moderate", description: "A meaningful pattern of depressive symptoms over the past week. EMDR can be helpful for the experiences that often underlie depression. Track this score over time to notice changes." },
    { max: 32, label: "Marked", description: "Substantial depressive symptoms with likely impact on energy, motivation, and wellbeing. Continue gently with the programme, and consider whether speaking to your GP or a mental health professional might offer useful additional support." },
    { max: 40, label: "Severe", description: "A high level of depressive symptoms with significant impact across multiple areas of life. At this level, additional support is strongly recommended alongside the programme — please consider speaking to your GP or a qualified mental health professional." }
  ],
  alerts: [
    {
      item: 10,
      trigger: '>=1',
      title: 'Important',
      message: 'Item 10 has been answered above zero. Any thoughts about not wanting to be here deserve careful attention and are not something to work through alone with a self-directed programme. Please pause your EMDR work for now and reach out for support: contact your GP, the Samaritans (116 123 in the UK), or NHS 111. If you are in immediate danger, call 999.'
    }
  ],
  stemKey: null,
  isActive: true
};

async function seedDepressionTracker() {
  console.log('🔌 Connecting to database...');
  await mongoose.connect(env.DATABASE_URL);
  console.log('✅ Database connected');

  // Find an admin to associate with the config
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error('❌ No admin user found. Please run seed-admin.ts first.');
    process.exit(1);
  }

  // Upsert the tracker config
  const existing = await SymptomTrackerConfig.findOne({ trackerType: 'depression' });
  
  if (existing) {
    console.log('🔄 Updating existing Depression tracker config...');
    await SymptomTrackerConfig.updateOne(
      { trackerType: 'depression' },
      { ...DEPRESSION_TRACKER, updatedBy: admin._id }
    );
    console.log('✅ Depression tracker updated');
  } else {
    console.log('✨ Creating new Depression tracker config...');
    await SymptomTrackerConfig.create({
      ...DEPRESSION_TRACKER,
      createdBy: admin._id
    });
    console.log('✅ Depression tracker created');
  }

  await mongoose.disconnect();
  console.log('🔌 Database disconnected');
}

seedDepressionTracker().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
