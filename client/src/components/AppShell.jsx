import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../roles';
import '../styles/shell.css';

/**
 * Shared frame for every logged-in page: header, role menu, and the page in <Outlet />.
 * Menu per role: items with `to` are live pages; items without it are not built yet
 * and are shown greyed out. Add `to` when the page ships.
 */
const NAV = {
  user: [
    { label: 'Home', to: '/home' },
    { label: 'Discussions', to: '/discussions' },
    { label: 'My posts' },
    { label: 'Saved' },
    { label: 'Notifications' },
  ],
  moderator: [
    { label: 'Home', to: '/moderator' },
    { label: 'Discussions', to: '/discussions' },
    { label: 'Review queue' },
    { label: 'Reports' },
    { label: 'Flagged posts' },
  ],
  admin: [
    { label: 'Home', to: '/admin' },
    { label: 'Discussions', to: '/discussions' },
    { label: 'Communities', to: '/admin/communities' },
    { label: 'Users' },
    { label: 'Roles' },
    { label: 'Categories' },
    { label: 'Settings' },
  ],
};

const initials = (name = '') =>
  name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true, state: { notice: 'You have been logged out.' } });
  }

  return (
    <div className="shell">
      <header className="shell-header">
        <Logo size={32} />
        <div className="shell-user">
          <span className={`role-badge role-${user.role}`}>{ROLE_LABELS[user.role]}</span>
          <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
          <span className="shell-name">{user.name}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <nav className="shell-nav" aria-label="Main">
        {NAV[user.role].map((item) =>
          item.to ? (
            // Home links use `end` so they are not highlighted on deeper pages;
            // Discussions stays highlighted on /discussions/new
            <NavLink key={item.label} to={item.to} end={item.label !== 'Discussions'}>
              {item.label}
            </NavLink>
          ) : (
            <span key={item.label} className="nav-disabled" aria-disabled="true" title="Not available yet">
              {item.label}
            </span>
          ),
        )}
      </nav>

      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
