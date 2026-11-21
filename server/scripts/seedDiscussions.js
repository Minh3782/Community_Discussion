/**
 * Test data for posting (U4/U5): one "Test Community" with 3 discussions.
 * There is no create-discussion screen yet, so this inserts them directly.
 * Safe to run again: existing records are reused, never duplicated.
 *
 *   npm run seed:discussions --prefix server
 *
 * Needs the demo accounts (created when the server starts) for the discussion creator.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Community from '../src/models/Community.js';
import Discussion from '../src/models/Discussion.js';
import User from '../src/models/User.js';

const COMMUNITY = {
  name: 'Test Community',
  description: 'Sample community for testing discussions and posts.',
  rules: 'Be respectful. Stay on topic. No spam.',
};

const DISCUSSIONS = [
  { title: 'Introduce yourself', content: 'New here? Say hello and tell us what you are interested in.' },
  { title: 'Study tips for exams', content: 'Share the study methods that work best for you.' },
  { title: 'Project ideas', content: 'Post ideas for side projects and find people to build them with.' },
];

const upsertOptions = { upsert: true, returnDocument: 'after' };

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
try {
  const creator = await User.findOne({ email: 'user@demo.com' });
  if (!creator) throw new Error('Demo account user@demo.com not found. Start the server once to create it.');

  const community = await Community.findOneAndUpdate(
    { name: COMMUNITY.name },
    { $setOnInsert: COMMUNITY },
    upsertOptions,
  );
  console.log(`Community: ${community.name} (${community.id})`);

  for (const d of DISCUSSIONS) {
    const discussion = await Discussion.findOneAndUpdate(
      { title: d.title, community: community._id },
      { $setOnInsert: { ...d, community: community._id, creator: creator._id } },
      upsertOptions,
    );
    console.log(`  Discussion: ${discussion.title} (${discussion.id})`);
  }
} finally {
  await mongoose.disconnect();
}
