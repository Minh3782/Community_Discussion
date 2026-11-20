import * as Users from '../data/userStore.js';

// Blocks requests without a logged-in session and makes the current user available as req.user.
// The user is loaded fresh on every request, so deleted accounts and role changes apply immediately.
export async function requireAuth(req, res, next) {
  const user = req.session?.userId && (await Users.findById(req.session.userId));
  if (!user) return res.status(401).json({ message: 'Not logged in.' });
  req.user = user;
  req.session.role = user.role;
  next();
}

// Usage: router.get('/admin-only', requireAuth, requireRole('admin'), handler)
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.session?.role)) return res.status(403).json({ message: 'Forbidden.' });
  next();
};
