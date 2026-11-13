/**
 * User data access layer — TEMPORARY IN-MEMORY STORE
 * ---------------------------------------------------------------------------
 * TODO(database): The MongoDB "users" collection has NOT been set up yet.
 * Until it is, accounts live in memory and are wiped whenever the server
 * restarts (the seeded demo accounts below are re-created on every start).
 *
 * To move to MongoDB, create `src/models/User.js` (Mongoose schema) with the
 * fields listed in USER SHAPE below, then re-implement each exported function
 * here with the Mongoose equivalent (hints next to each function). The auth
 * controller only talks to these functions, so nothing else needs to change.
 *
 * USER SHAPE (suggested Mongoose schema):
 *   name                 String, required, trimmed
 *   email                String, required, UNIQUE index, lowercase, trimmed
 *   passwordHash         String, required (bcrypt hash, never the raw password)
 *   role                 String, enum ['user', 'moderator', 'admin'], default 'user'
 *   failedLoginAttempts  Number, default 0
 *   lockUntil            Date, default null   (set for 5 min after 5 failed attempts)
 *   resetTokenHash       String, default null (sha256 of the emailed reset token)
 *   resetTokenExpires    Date, default null
 *   createdAt/updatedAt  -> use { timestamps: true }
 * ---------------------------------------------------------------------------
 */
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const users = new Map(); // id -> user

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// Mongo: User.findOne({ email: normalizeEmail(email) })
export async function findByEmail(email) {
  const target = normalizeEmail(email);
  for (const user of users.values()) {
    if (user.email === target) return user;
  }
  return null;
}

// Mongo: User.findById(id)
export async function findById(id) {
  return users.get(id) || null;
}

// Mongo: User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: new Date() } })
export async function findByValidResetTokenHash(hash) {
  for (const user of users.values()) {
    if (user.resetTokenHash === hash && user.resetTokenExpires > new Date()) return user;
  }
  return null;
}

// Mongo: User.create({...}). The unique index on email will throw error code
// 11000 on duplicates; the controller already checks findByEmail first.
export async function createUser({ name, email, passwordHash, role = 'user' }) {
  const now = new Date();
  const user = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: normalizeEmail(email),
    passwordHash,
    role,
    failedLoginAttempts: 0,
    lockUntil: null,
    resetTokenHash: null,
    resetTokenExpires: null,
    createdAt: now,
    updatedAt: now,
  };
  users.set(user.id, user);
  return user;
}

// Mongo: User.findByIdAndUpdate(id, changes, { new: true })
export async function updateUser(id, changes) {
  const user = users.get(id);
  if (!user) return null;
  Object.assign(user, changes, { updatedAt: new Date() });
  return user;
}

/**
 * Demo accounts, one per role, so the acceptance tests can be run right away.
 * TODO(database): replace with a seed script (e.g. `npm run seed`) once the
 * MongoDB collection exists. Moderator/admin accounts cannot self-register.
 */
export async function seedDemoUsers() {
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);
  const demo = [
    { name: 'Uyen User', email: 'user@demo.com', role: 'user' },
    { name: 'Minh Moderator', email: 'moderator@demo.com', role: 'moderator' },
    { name: 'An Admin', email: 'admin@demo.com', role: 'admin' },
  ];
  for (const u of demo) {
    if (!(await findByEmail(u.email))) await createUser({ ...u, passwordHash });
  }
  console.log(`Seeded demo accounts (password: ${password}): ${demo.map((d) => d.email).join(', ')}`);
}
