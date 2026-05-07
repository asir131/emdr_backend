/**
 * Fix SessionProgress duplicate key error
 * 
 * Run: node scratch/fix_session_progress_index.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixSessionProgressIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('DATABASE_URL or MONGO_URI not found in .env file');
    }
    
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

    // Check if problematic userId index exists
    const userIdIndex = indexes.find((idx) => 
      idx.name === 'userId_1' && idx.unique === true
    );
    
    if (userIdIndex) {
      console.log('\n⚠️  Found problematic index: userId_1 (unique)');
      console.log('🗑️  Dropping old userId unique index...');
      
      try {
        await collection.dropIndex('userId_1');
        console.log('✅ Old index dropped successfully!');
      } catch (dropError) {
        console.error('❌ Failed to drop index:', dropError.message);
        console.log('\n💡 Try manually in MongoDB shell:');
        console.log('   db.sessionprogresses.dropIndex("userId_1")');
      }
    } else {
      console.log('\n✅ No problematic userId index found!');
      console.log('   Database is already clean.');
    }

    console.log('\n📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((idx) => {
      const uniqueLabel = idx.unique ? ' (UNIQUE)' : '';
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${uniqueLabel}`);
    });

    console.log('\n✅ Fix completed!');
    console.log('   You can now use the API without duplicate key errors.');
    console.log('   Users can update their journey progress multiple times.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Manual fix:');
    console.log('   1. Open MongoDB shell or Compass');
    console.log('   2. Run: db.sessionprogresses.dropIndex("userId_1")');
    console.log('   3. Verify: db.sessionprogresses.getIndexes()');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixSessionProgressIndex();
