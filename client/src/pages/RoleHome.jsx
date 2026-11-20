import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../roles';

/**
 * Home screen per role (rendered inside AppShell, which draws the header and menu).
 * Cards with `to` open a live page; the others describe features built in later stories.
 */
const ROLES = {
  user: {
    title: 'Your discussions',
    intro: 'Catch up on topics you follow and start new conversations.',
    actions: [
      { title: 'Start a discussion', text: 'Ask a question or share an idea with the community.', to: '/discussions/new' },
      { title: 'Browse topics', text: 'Find conversations by category or keyword.' },
      { title: 'Saved threads', text: 'Come back to the discussions you bookmarked.' },
      { title: 'Notifications', text: 'See replies and mentions in one place.' },
    ],
  },
  moderator: {
    title: 'Moderation desk',
    intro: 'Keep conversations respectful: review reports and flagged content.',
    actions: [
      { title: 'Review reports', text: 'Handle posts and comments members have reported.' },
      { title: 'Pending posts', text: 'Approve or reject posts waiting for review.' },
      { title: 'Mute a member', text: 'Temporarily restrict members who break the rules.' },
      { title: 'Community rules', text: 'Check the guidelines you enforce.' },
    ],
  },
  admin: {
    title: 'Admin console',
    intro: 'Manage accounts, roles and platform settings.',
    actions: [
      { title: 'Manage users', text: 'Search, suspend or remove accounts.' },
      { title: 'Assign roles', text: 'Promote members to moderator or admin.' },
      { title: 'Categories', text: 'Create and organise discussion categories.' },
      { title: 'Platform settings', text: 'Configure security and email options.' },
    ],
  },
};

export default function RoleHome({ role }) {
  const { user } = useAuth();
  const cfg = ROLES[role];
  const label = ROLE_LABELS[role];

  return (
    <>
      <section className="panel panel-welcome">
        <p className="eyebrow">{label} home</p>
        <h1>Hi {user.name.split(' ')[0]}, welcome back</h1>
        <p className="muted">{cfg.intro}</p>
      </section>

      <section className="panel panel-actions" aria-labelledby="qa-title">
        <h2 id="qa-title">{cfg.title}</h2>
        <div className="action-grid">
          {cfg.actions.map((a) =>
            a.to ? (
              <Link key={a.title} to={a.to} className="action-card action-link">
                <h3>{a.title}</h3>
                <p className="muted">{a.text}</p>
              </Link>
            ) : (
              <article key={a.title} className="action-card">
                <h3>{a.title}</h3>
                <p className="muted">{a.text}</p>
              </article>
            ),
          )}
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
          <dt>Role</dt><dd>{label}</dd>
        </dl>
      </aside>
    </>
  );
}
