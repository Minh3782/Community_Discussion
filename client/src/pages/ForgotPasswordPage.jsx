import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import api, { errorMessage } from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={<Link to="/login">← Back to log in</Link>}
    >
      {sent ? (
        <div className="form">
          <p className="alert alert-success" role="status">{sent}</p>
          <p className="muted">The link is valid for 15 minutes. Check your spam folder if it doesn't arrive.</p>
          {import.meta.env.DEV && (
            <p className="dev-note">Dev mode: no email server is set up, so the link is printed in the server terminal.</p>
          )}
          <button type="button" className="btn btn-ghost btn-block" onClick={() => setSent('')}>
            Send to a different email
          </button>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn btn-primary btn-block" disabled={submitting || !email}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
