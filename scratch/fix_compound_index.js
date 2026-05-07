/**
 * Fix SessionProgress compound index - make it unique
 * 
 * Run: node scratch/fix_compound_index.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixCompoundIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI;
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('sessionprogresses');

    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((idx) => {
      const uniqueLabel = idx.unique ? ' (UNIQUE)' : '';
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${uniqueLabel}`);
    });

    // Drop the non-unique compound index
    console.log('\n🗑️  Dropping non-unique userId_1_journeyId_1 index...');
    try {
      await collection.dropIndex('userId_1_journeyId_1');
      console.log('✅ Old index dropped');
    } catch (error) {
      console.log('⚠️  Could not drop index:', error.message);
    }

    // Create new UNIQUE compound index
    console.log('\n🔧 Creating UNIQUE compound index...');
    try {
      await collection.createIndex(
        { userId: 1, journeyId: 1 },
        { unique: true }
      );
      console.log('✅ UNIQUE compound index created');
    } catch (error) {
      console.log('❌ Failed to create index:', error.message);
    }

    console.log('\n📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((idx) => {
      const uniqueLabel = idx.unique ? ' (UNIQUE)' : '';
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${uniqueLabel}`);
    });

    console.log('\n✅ Fix completed!');
    console.log('   Now users can update their journey progress multiple times.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixCompoundIndex();
