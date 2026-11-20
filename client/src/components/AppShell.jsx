import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import '../styles/shell.css';

const ROLE_LABELS = {
  user: 'Member',
  moderator: 'Moderator',
  admin: 'Administrator',
};

const HOME_PATHS = {
  user: '/home',
  moderator: '/moderator',
  admin: '/admin',
};

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();

    navigate('/login', {
      replace: true,
      state: { notice: 'You have been logged out.' },
    });
  }

  return (
    <div className="shell">
      <header className="shell-header">
        <Logo size={32} />

        <div className="shell-user">
          <span className={`role-badge role-${user.role}`}>
            {ROLE_LABELS[user.role]}
          </span>

          <span className="avatar" aria-hidden="true">
            {initials(user.name)}
          </span>

          <span className="shell-name">{user.name}</span>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <nav className="shell-nav" aria-label="Main">
        <NavLink to={HOME_PATHS[user.role]} end>
          Home
        </NavLink>

        <NavLink to="/discussions">
          Discussions
        </NavLink>
      </nav>

      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}