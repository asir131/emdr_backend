/**
 * Check SessionProgress collection data and indexes
 * 
 * Run: node scratch/check_session_progress_data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function checkSessionProgressData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI;
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('sessionprogresses');

    // Check indexes
    console.log('📋 All Indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((idx) => {
      const uniqueLabel = idx.unique ? ' (UNIQUE)' : '';
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${uniqueLabel}`);
    });

    // Check existing documents
    console.log('\n📊 Existing Documents:');
    const docs = await collection.find({}).limit(5).toArray();
    console.log(`  Total documents: ${await collection.countDocuments()}`);
    
    if (docs.length > 0) {
      console.log('\n  Sample documents:');
      docs.forEach((doc, i) => {
        console.log(`  ${i + 1}. userId: ${doc.userId}, journeyId: ${doc.journeyId}`);
      });
      
      // Check for duplicates
      console.log('\n🔍 Checking for duplicate userId+journeyId combinations...');
      const duplicates = await collection.aggregate([
        {
          $group: {
            _id: { userId: '$userId', journeyId: '$journeyId' },
            count: { $sum: 1 },
            ids: { $push: '$_id' }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ]).toArray();
      
      if (duplicates.length > 0) {
        console.log(`  ⚠️  Found ${duplicates.length} duplicate combinations:`);
        duplicates.forEach((dup) => {
          console.log(`    - userId: ${dup._id.userId}, journeyId: ${dup._id.journeyId} (${dup.count} times)`);
          console.log(`      Document IDs: ${dup.ids.join(', ')}`);
        });
      } else {
        console.log('  ✅ No duplicates found');
      }
    } else {
      console.log('  No documents found in collection');
    }

    // Try to recreate the compound unique index
    console.log('\n🔧 Attempting to ensure compound unique index...');
    try {
      await collection.createIndex(
        { userId: 1, journeyId: 1 },
        { unique: true, name: 'userId_1_journeyId_1' }
      );
      console.log('  ✅ Compound unique index ensured');
    } catch (indexError) {
      console.log('  ⚠️  Index already exists or error:', indexError.message);
    }

    console.log('\n📋 Final Indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((idx) => {
      const uniqueLabel = idx.unique ? ' (UNIQUE)' : '';
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${uniqueLabel}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkSessionProgressData();
