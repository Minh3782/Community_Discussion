import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminCommunitiesPage from './pages/AdminCommunitiesPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityPage from './pages/CommunityPage';
import CreatePostPage from './pages/CreatePostPage';
import RoleHome from './pages/RoleHome';
import DiscussionDetailPage from './pages/DiscussionDetailPage';
import DiscussionsPage from './pages/DiscussionsPage';
import NewDiscussionPage from './pages/NewDiscussionPage';

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* AppShell supplies one shared header and menu for signed-in pages. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route element={<ProtectedRoute roles={['user']} />}>
            <Route path="/home" element={<RoleHome role="user" />} />
            <Route path="/posts/new" element={<CreatePostPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['moderator']} />}>
            <Route path="/moderator" element={<RoleHome role="moderator" />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<RoleHome role="admin" />} />
            <Route path="/admin/communities" element={<AdminCommunitiesPage />} />
          </Route>

          {/* Available to every signed-in role. */}
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/communities/:communityId" element={<CommunityPage />} />
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/discussions/new" element={<NewDiscussionPage />} />
          <Route path="/discussions/:discussionId" element={<DiscussionDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
