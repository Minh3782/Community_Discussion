import Logo from './Logo';
import '../styles/auth.css';

// Two-region page grid: brand panel + form panel (stacks on small screens)
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <Logo size={44} />
        <div className="auth-brand-copy">
          <h2>Talk it through, together.</h2>
          <p>A calm place for your community to ask questions, share ideas and help each other.</p>
        </div>
        <ul className="auth-points">
          <li>Open discussions by topic</li>
          <li>Moderated for respectful conversations</li>
          <li>Your account, kept secure</li>
        </ul>
      </aside>

      <main className="auth-main">
        <section className="auth-card" aria-labelledby="auth-title">
          <header className="auth-head">
            <h1 id="auth-title">{title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
          </header>
          {children}
        </section>
        {footer && <p className="auth-footer">{footer}</p>}
      </main>
    </div>
  );
}
