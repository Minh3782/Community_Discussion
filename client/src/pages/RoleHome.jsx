import { NavLink, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import '../styles/shell.css';

/**
 * One home screen per role. Each entry lists the navigation and quick actions
 * that role will get. The features themselves are built in later stories.
 */
const ROLES = {
  user: {
    label: 'Member',
    title: 'Your discussions',
    intro: 'Catch up on topics you follow and start new conversations.',
    nav: ['Home', 'Discussions', 'My posts', 'Saved', 'Notifications'],
    actions: [
      { title: 'Start a discussion', text: 'Ask a question or share an idea with the community.' },
      { title: 'Browse topics', text: 'Find conversations by category or keyword.' },
      { title: 'Saved threads', text: 'Come back to the discussions you bookmarked.' },
      { title: 'Notifications', text: 'See replies and mentions in one place.' },
    ],
  },
  moderator: {
    label: 'Moderator',
    title: 'Moderation desk',
    intro: 'Keep conversations respectful: review reports and flagged content.',
    nav: ['Home', 'Review queue', 'Reports', 'Flagged posts', 'Discussions'],
    actions: [
      { title: 'Review reports', text: 'Handle posts and comments members have reported.' },
      { title: 'Pending posts', text: 'Approve or reject posts waiting for review.' },
      { title: 'Mute a member', text: 'Temporarily restrict members who break the rules.' },
      { title: 'Community rules', text: 'Check the guidelines you enforce.' },
    ],
  },
  admin: {
    label: 'Administrator',
    title: 'Admin console',
    intro: 'Manage accounts, roles and platform settings.',
    nav: ['Home', 'Users', 'Roles', 'Communities', 'Categories', 'Settings'],
    actions: [
      { title: 'Manage users', text: 'Search, suspend or remove accounts.' },
      { title: 'Assign roles', text: 'Promote members to moderator or admin.' },
      { title: 'Categories', text: 'Create and organise discussion categories.' },
      { title: 'Platform settings', text: 'Configure security and email options.' },
    ],
  },
};

const initials = (name) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export default function RoleHome({ role, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cfg = ROLES[role];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true, state: { notice: 'You have been logged out.' } });
  };

  return (
    <div className="shell">
      <header className="shell-header">
        <Logo size={32} />
        <div className="shell-user">
          <span className={`role-badge role-${role}`}>{cfg.label}</span>
          <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
          <span className="shell-name">{user.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <nav className="shell-nav" aria-label="Main">
        {cfg.nav.map((item, i) => (
          role === 'admin' && (item === 'Home' || item === 'Communities') ? (
            <NavLink key={item} end to={item === 'Home' ? '/admin' : '/admin/communities'}>
              {item}
            </NavLink>
          ) : (
          <a key={item} href="#" className={i === 0 ? 'active' : ''} aria-current={i === 0 ? 'page' : undefined}>
            {item}
          </a>
          )
        ))}
      </nav>

      <main className="shell-main">
        {children ?? <>
        <section className="panel panel-welcome">
          <p className="eyebrow">{cfg.label} home</p>
          <h1>Hi {user.name.split(' ')[0]}, welcome back</h1>
          <p className="muted">{cfg.intro}</p>
        </section>

        <section className="panel panel-actions" aria-labelledby="qa-title">
          <h2 id="qa-title">{cfg.title}</h2>
          <div className="action-grid">
            {cfg.actions.map((a) => (
              <article key={a.title} className="action-card">
                <h3>{a.title}</h3>
                <p className="muted">{a.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel-activity">
          <h2>Recent activity</h2>
          <div className="empty">
            <p>Nothing here yet. Activity will show up once discussions are live.</p>
          </div>
        </section>

        <aside className="panel panel-account">
          <h2>Your account</h2>
          <dl className="kv">
            <dt>Name</dt><dd>{user.name}</dd>
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Role</dt><dd>{cfg.label}</dd>
          </dl>
        </aside>
        </>}
      </main>
    </div>
  );
}
