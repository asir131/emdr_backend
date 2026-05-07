/**
 * Clean SessionProgress collection and fix indexes
 * 
 * This will:
 * 1. Delete ALL existing session progress data
 * 2. Drop ALL indexes
 * 3. Create only the correct UNIQUE compound index
 * 
 * Run: node scratch/clean_and_fix_session_progress.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanAndFix() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI;
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('sessionprogresses');

    // Step 1: Show current state
    console.log('📋 Current state:');
    const count = await collection.countDocuments();
    console.log(`  Documents: ${count}`);
    
    const indexes = await collection.indexes();
    console.log(`  Indexes: ${indexes.length}`);
    indexes.forEach((idx) => {
      const uniqueLabel = idx.unique ? ' (UNIQUE)' : '';
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}${uniqueLabel}`);
    });

    // Step 2: Delete all documents
    console.log('\n🗑️  Deleting all documents...');
    const deleteResult = await collection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} documents`);

    // Step 3: Drop all indexes except _id
    console.log('\n🗑️  Dropping all indexes...');
    const indexNames = indexes
      .map(idx => idx.name)
      .filter(name => name !== '_id_'); // Keep _id index
    
    for (const indexName of indexNames) {
      try {
        await collection.dropIndex(indexName);
        console.log(`  ✅ Dropped: ${indexName}`);
      } catch (error) {
        console.log(`  ⚠️  Could not drop ${indexName}:`, error.message);
      }
    }

    // Step 4: Create the correct UNIQUE compound index
    console.log('\n🔧 Creating UNIQUE compound index...');
    await collection.createIndex(
      { userId: 1, journeyId: 1 },
      { unique: true, name: 'userId_1_journeyId_1' }
    );
    console.log('✅ UNIQUE compound index created');

    // Step 5: Show final state
    console.log('\n📋 Final state:');
    const finalCount = await collection.countDocuments();
    console.log(`  Documents: ${finalCount}`);
    
    const finalIndexes = await collection.indexes();
    console.log(`  Indexes: ${finalIndexes.length}`);
    finalIndexes.forEach((idx) => {
      const uniqueLabel = idx.unique ? ' (UNIQUE)' : '';
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}${uniqueLabel}`);
    });

    console.log('\n✅ Clean and fix completed!');
    console.log('\n⚠️  IMPORTANT: Restart your server now!');
    console.log('   Run: npm run dev (or your start command)');
    console.log('\n   Then test the API again.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

cleanAndFix();
