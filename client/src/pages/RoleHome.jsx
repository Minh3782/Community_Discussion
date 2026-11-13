import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import '../styles/shell.css';

/**
 * One home screen per role. Each entry lists the navigation and quick actions
 * that role will get. The features themselves are built in later stories,
 * so they are shown as "Coming soon".
 */
const ROLES = {
  user: {
    label: 'Member',
    title: 'Your discussions',
    intro: 'Catch up on topics you follow and start new conversations.',
    nav: ['Home', 'Discussions', 'My posts', 'Saved', 'Notifications'],
    actions: [
      { icon: '✍️', title: 'Start a discussion', text: 'Ask a question or share an idea with the community.' },
      { icon: '🔎', title: 'Browse topics', text: 'Find conversations by category or keyword.' },
      { icon: '🔖', title: 'Saved threads', text: 'Come back to the discussions you bookmarked.' },
      { icon: '🔔', title: 'Notifications', text: 'See replies and mentions in one place.' },
    ],
  },
  moderator: {
    label: 'Moderator',
    title: 'Moderation desk',
    intro: 'Keep conversations respectful: review reports and flagged content.',
    nav: ['Home', 'Review queue', 'Reports', 'Flagged posts', 'Discussions'],
    actions: [
      { icon: '🚩', title: 'Review reports', text: 'Handle posts and comments members have reported.' },
      { icon: '📝', title: 'Pending posts', text: 'Approve or reject posts waiting for review.' },
      { icon: '🔇', title: 'Mute a member', text: 'Temporarily restrict members who break the rules.' },
      { icon: '📜', title: 'Community rules', text: 'Check the guidelines you enforce.' },
    ],
  },
  admin: {
    label: 'Administrator',
    title: 'Admin console',
    intro: 'Manage accounts, roles and platform settings.',
    nav: ['Home', 'Users', 'Roles', 'Categories', 'Settings'],
    actions: [
      { icon: '👥', title: 'Manage users', text: 'Search, suspend or remove accounts.' },
      { icon: '🛡️', title: 'Assign roles', text: 'Promote members to moderator or admin.' },
      { icon: '🗂️', title: 'Categories', text: 'Create and organise discussion categories.' },
      { icon: '⚙️', title: 'Platform settings', text: 'Configure security and email options.' },
    ],
  },
};

const initials = (name) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export default function RoleHome({ role }) {
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
          <a key={item} href="#" className={i === 0 ? 'active' : ''} aria-current={i === 0 ? 'page' : undefined}>
            {item}
          </a>
        ))}
      </nav>

      <main className="shell-main">
        <section className="panel panel-welcome">
          <p className="eyebrow">{cfg.label} home</p>
          <h1>Hi {user.name.split(' ')[0]}, welcome back 👋</h1>
          <p className="muted">{cfg.intro}</p>
        </section>

        <section className="panel panel-actions" aria-labelledby="qa-title">
          <h2 id="qa-title">{cfg.title}</h2>
          <div className="action-grid">
            {cfg.actions.map((a) => (
              <article key={a.title} className="action-card">
                <span className="action-icon" aria-hidden="true">{a.icon}</span>
                <h3>{a.title}</h3>
                <p className="muted">{a.text}</p>
                <span className="soon">Coming soon</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel-activity">
          <h2>Recent activity</h2>
          <div className="empty">
            <span aria-hidden="true">🌱</span>
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
      </main>
    </div>
  );
}
