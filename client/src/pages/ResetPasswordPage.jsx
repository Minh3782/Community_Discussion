import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import api, { errorMessage } from '../api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.password.length < 8) errs.password = 'Use at least 8 characters.';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password: form.password });
      navigate('/login', { replace: true, state: { notice: data.message } });
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Link not valid" footer={<Link to="/login">← Back to log in</Link>}>
        <p className="alert alert-error">This reset link is missing its token.</p>
        <Link className="btn btn-primary btn-block" to="/forgot-password">Request a new link</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" footer={<Link to="/login">← Back to log in</Link>}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <p className="alert alert-error" role="alert">
            {errors.form} <Link to="/forgot-password">Request a new link</Link>
          </p>
        )}
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update}
          error={errors.password}
          hint="At least 8 characters"
        />
        <Field
          label="Confirm new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={update}
          error={errors.confirm}
        />
        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  );
}
