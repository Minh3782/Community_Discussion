import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import * as Users from '../data/userStore.js';
import { sendMail } from '../utils/mailer.js';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 5;
const RESET_TOKEN_MINUTES = 15;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

const httpError = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });

// Only ever send these fields to the browser
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    throw httpError(400, `Password must be at least ${MIN_PASSWORD} characters.`);
  }
}

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password } = req.body ?? {};
  if (!name?.trim()) throw httpError(400, 'Name is required.');
  if (!EMAIL_RE.test(String(email || '').trim())) throw httpError(400, 'Enter a valid email address.');
  validatePassword(password);

  // Duplicate-email check
  if (await Users.findByEmail(email)) {
    throw httpError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Self-registration always creates a regular user; moderators/admins are assigned.
  let user;
  try {
    user = await Users.createUser({ name, email, passwordHash, role: 'user' });
  } catch (err) {
    // Two sign-ups with the same email at the same moment: the unique index catches the second one
    if (err.code === 11000) throw httpError(409, 'An account with this email already exists.');
    throw err;
  }
  res.status(201).json({ message: 'Account created. You can now log in.', user: publicUser(user) });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw httpError(400, 'Email and password are required.');

  const generic = 'Invalid email or password.';
  const user = await Users.findByEmail(email);
  if (!user) throw httpError(401, generic);

  const now = Date.now();

  // Still locked out?
  if (user.lockUntil && user.lockUntil.getTime() > now) {
    const retryAfter = Math.ceil((user.lockUntil.getTime() - now) / 1000);
    throw httpError(423, lockMessage(retryAfter), { retryAfter });
  }
  // Lock expired: start counting again
  if (user.lockUntil) await Users.updateUser(user.id, { lockUntil: null, failedLoginAttempts: 0 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      await Users.updateUser(user.id, {
        failedLoginAttempts: 0,
        lockUntil: new Date(now + LOCK_MINUTES * 60_000),
      });
      const retryAfter = LOCK_MINUTES * 60;
      throw httpError(423, lockMessage(retryAfter), { retryAfter });
    }
    await Users.updateUser(user.id, { failedLoginAttempts: attempts });
    const left = MAX_FAILED_ATTEMPTS - attempts;
    throw httpError(401, `${generic} ${left} attempt${left === 1 ? '' : 's'} left before a ${LOCK_MINUTES}-minute lock.`);
  }

  await Users.updateUser(user.id, { failedLoginAttempts: 0, lockUntil: null });

  // New session id on login (prevents session fixation)
  await new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));
  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ user: publicUser(user) });
}

function lockMessage(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `Too many failed attempts. Try again in ${m}:${String(s).padStart(2, '0')}.`;
}

// POST /api/auth/logout
export async function logout(req, res) {
  await new Promise((resolve, reject) => req.session.destroy((err) => (err ? reject(err) : resolve())));
  res.clearCookie('sid');
  res.json({ message: 'Logged out.' });
}

// GET /api/auth/me
export async function me(req, res) {
  const user = req.session?.userId && (await Users.findById(req.session.userId));
  if (!user) throw httpError(401, 'Not logged in.');
  res.json({ user: publicUser(user) });
}

// POST /api/auth/forgot-password
export async function forgotPassword(req, res) {
  const { email } = req.body ?? {};
  if (!EMAIL_RE.test(String(email || '').trim())) throw httpError(400, 'Enter a valid email address.');

  // Same response whether or not the email exists, so accounts can't be discovered
  const response = { message: 'If that email is registered, a reset link has been sent.' };

  const user = await Users.findByEmail(email);
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    await Users.updateUser(user.id, {
      resetTokenHash: hashToken(token),
      resetTokenExpires: new Date(Date.now() + RESET_TOKEN_MINUTES * 60_000),
    });
    const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your Community Discussion password',
      text: `Hi ${user.name},\n\nUse this link to set a new password (valid for ${RESET_TOKEN_MINUTES} minutes):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
    });
  }
  res.json(response);
}

// POST /api/auth/reset-password
export async function resetPassword(req, res) {
  const { token, password } = req.body ?? {};
  if (!token) throw httpError(400, 'Reset token is missing.');
  validatePassword(password);

  const user = await Users.findByValidResetTokenHash(hashToken(token));
  if (!user) throw httpError(400, 'This reset link is invalid or has expired.');

  await Users.updateUser(user.id, {
    passwordHash: await bcrypt.hash(password, 10),
    resetTokenHash: null,
    resetTokenExpires: null,
    failedLoginAttempts: 0,
    lockUntil: null,
  });
  res.json({ message: 'Password updated. You can now log in.' });
}
