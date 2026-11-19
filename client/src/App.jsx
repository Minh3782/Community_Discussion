import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminCommunitiesPage from './pages/AdminCommunitiesPage';
import RoleHome from './pages/RoleHome';

export default function App() {
  return (
    <Routes>
      {/* Public pages (logged-in users are redirected to their home) */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Role home screens */}
      <Route element={<ProtectedRoute roles={['user']} />}>
        <Route path="/home" element={<RoleHome role="user" />} />
      </Route>
      <Route element={<ProtectedRoute roles={['moderator']} />}>
        <Route path="/moderator" element={<RoleHome role="moderator" />} />
      </Route>
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<RoleHome role="admin" />} />
        <Route path="/admin/communities" element={<AdminCommunitiesPage />} />
      </Route>

      {/* App opens on the login page; ProtectedRoute bounces logged-in users home */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
