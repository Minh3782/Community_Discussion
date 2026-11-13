import { Navigate, Outlet } from 'react-router-dom';
import { ROLE_HOME, useAuth } from '../context/AuthContext';

// Only logged-in users with an allowed role can see the nested routes
export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}

// Login/register pages: send already-logged-in users to their home screen
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}
