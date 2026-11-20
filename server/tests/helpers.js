import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import Community from '../src/models/Community.js';
import Discussion from '../src/models/Discussion.js';
import Membership from '../src/models/Membership.js';
import Post from '../src/models/Post.js';
import User from '../src/models/User.js';
import { seedDemoUsers } from '../src/data/userStore.js';

export const PASSWORD = 'Password123!';
export const DEMO = {
  user: 'user@demo.com',
  moderator: 'moderator@demo.com',
  admin: 'admin@demo.com',
};

let memoryServer;

/**
 * Connects to a throw-away database.
 * - Default: an in-memory MongoDB (nothing is installed, nothing is shared).
 * - TEST_MONGO_URI: use your own database instead. Its name MUST contain "test",
 *   so the tests can never wipe the team's real data by accident.
 */
export async function startTestDb() {
  let uri = process.env.TEST_MONGO_URI;
  if (uri) {
    const dbName = new URL(uri).pathname.replace('/', '');
    if (!/test/i.test(dbName)) {
      throw new Error(`TEST_MONGO_URI database "${dbName}" must contain "test" (e.g. community_discussion_test).`);
    }
  } else {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('community_discussion_test');
  }
  await mongoose.connect(uri);
  await Promise.all([User, Community, Discussion, Membership, Post].map((m) => m.init()));
  await resetData();
  await seedDemoUsers();
}

export async function stopTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await memoryServer?.stop();
}

// Clears everything except users, so every test starts from the same demo accounts
export async function resetData() {
  await Promise.all([Community, Discussion, Membership, Post].map((m) => m.deleteMany({})));
}

// A supertest agent keeps the session cookie, like a browser tab
export async function loginAs(role) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email: DEMO[role], password: PASSWORD });
  if (res.status !== 200) throw new Error(`Login as ${role} failed with ${res.status}`);
  return agent;
}

export const anonymous = () => request(app);

export const demoUser = (role) => User.findOne({ email: DEMO[role] });

export const makeCommunity = (overrides = {}) =>
  Community.create({ name: 'Coding Enthusiasts', description: 'A place to discuss code', rules: 'No spamming', ...overrides });

export const makeDiscussion = async (community, creator, overrides = {}) =>
  Discussion.create({ title: 'Intro thread', content: 'Say hello', community: community._id, creator: creator._id, ...overrides });
