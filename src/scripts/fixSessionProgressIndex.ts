/**
 * Fix Script: Drop the old `userId_1` unique index from sessionprogresses collection.
 *
 * The old index `{ userId: 1 }` with unique:true prevents a user from having
 * more than one journey progress record. The correct index is compound:
 * `{ userId: 1, journeyId: 1 }` which allows one record per user per journey.
 *
 * Run once:  npx ts-node src/scripts/fixSessionProgressIndex.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function fixIndex() {
  const uri = process.env.DATABASE_URL || process.env.MONGO_URI || '';

  if (!uri) {
    console.error('❌  DATABASE_URL / MONGO_URI env variable not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB');

  const db = mongoose.connection.db!;
  const collection = db.collection('sessionprogresses');

  // List current indexes so we know what exists
  const indexes = await collection.indexes();
  console.log('\n📋  Current indexes on sessionprogresses:');
  indexes.forEach((idx) => console.log(' -', JSON.stringify(idx)));

  // Drop the bad solo userId index if it exists
  const badIndex = indexes.find(
    (idx) =>
      idx.key &&
      Object.keys(idx.key).length === 1 &&
      idx.key['userId'] !== undefined &&
      idx.unique === true,
  );

  if (badIndex) {
    const indexName = badIndex.name as string;
    await collection.dropIndex(indexName);
    console.log(`\n🗑️   Dropped bad index: "${indexName}"`);
  } else {
    console.log('\n✔️   No bad userId-only unique index found — nothing to drop.');
  }

  // Verify final state
  const finalIndexes = await collection.indexes();
  console.log('\n📋  Final indexes on sessionprogresses:');
  finalIndexes.forEach((idx) => console.log(' -', JSON.stringify(idx)));

  await mongoose.disconnect();
  console.log('\n✅  Done. You can now call /api/session-progress/update multiple times per journey.');
}

fixIndex().catch((err) => {
  console.error('❌  Script failed:', err);
  process.exit(1);
});
