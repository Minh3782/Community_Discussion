import { findById } from '../data/userStore.js';

// Blocks requests without a logged-in session
export function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not logged in.' });
  next();
}

export async function requireMember(req, res, next) {
  const user = await findById(req.session.userId);
  if (!user) return res.status(401).json({ message: 'Not logged in.' });
  if (user.role !== 'user') return res.status(403).json({ message: 'Forbidden.' });
  next();
}

// Usage: router.get('/admin-only', requireAuth, requireRole('admin'), handler)
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.session?.role)) return res.status(403).json({ message: 'Forbidden.' });
  next();
};
