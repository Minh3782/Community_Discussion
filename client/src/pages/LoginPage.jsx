import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import { ROLE_HOME, useAuth } from '../context/AuthContext';
import { errorMessage } from '../api';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [error, setError] = useState('');
  const [lockedFor, setLockedFor] = useState(0); // seconds until the account unlocks
  const [submitting, setSubmitting] = useState(false);
  const notice = location.state?.notice;

  // Count down the 5-minute lock
  useEffect(() => {
    if (lockedFor <= 0) return;
    const t = setTimeout(() => setLockedFor((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [lockedFor]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      if (err.response?.status === 423) {
        setLockedFor(err.response.data.retryAfter || 300);
      } else {
        setError(errorMessage(err));
      }
      setForm((f) => ({ ...f, password: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  const locked = lockedFor > 0;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to join the conversation."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {notice && !error && !locked && <p className="alert alert-success" role="status">{notice}</p>}
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        {locked && (
          <p className="alert alert-warn" role="alert">
            Too many failed attempts. Your account is locked. Try again in <b>{fmt(lockedFor)}</b>.
          </p>
        )}

        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={update} required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={update}
          required
        />

        <div className="form-row">
          <Link to="/forgot-password" className="link-subtle">Forgot password?</Link>
        </div>

        <button className="btn btn-primary btn-block" disabled={submitting || locked || !form.email || !form.password}>
          {submitting ? 'Logging in…' : locked ? `Locked · ${fmt(lockedFor)}` : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
