/**
 * User data access layer, backed by the MongoDB "users" collection
 * (see src/models/User.js). The auth controller only talks to these functions.
 */
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const findByEmail = (email) => User.findOne({ email: normalizeEmail(email) });

export const findById = (id) => (User.db.base.isValidObjectId(id) ? User.findById(id) : null);

export const findByValidResetTokenHash = (hash) =>
  User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: new Date() } });

export async function createUser({ name, email, passwordHash, role = 'user' }) {
  return User.create({ name, email: normalizeEmail(email), passwordHash, role });
}

export const updateUser = (id, changes) => User.findByIdAndUpdate(id, changes, { returnDocument: 'after' });

/**
 * Demo accounts, one per role, so the acceptance tests can be run right away.
 * Only created if missing, so it is safe to run on every start. Moderator/admin accounts cannot self-register.
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
