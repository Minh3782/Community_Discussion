import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RoleHome from './pages/RoleHome';
import DiscussionsPage from './pages/DiscussionsPage';

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />
      </Route>

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />

      {/* Pages that require login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route element={<ProtectedRoute roles={['user']} />}>
            <Route
              path="/home"
              element={<RoleHome role="user" />}
            />
          </Route>

          <Route element={<ProtectedRoute roles={['moderator']} />}>
            <Route
              path="/moderator"
              element={<RoleHome role="moderator" />}
            />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route
              path="/admin"
              element={<RoleHome role="admin" />}
            />
          </Route>

          <Route
            path="/discussions"
            element={<DiscussionsPage />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}
