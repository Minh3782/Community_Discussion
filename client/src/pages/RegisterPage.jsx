import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import api, { errorMessage } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (form.password.length < 8) errs.password = 'Use at least 8 characters.';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const { name, email, password } = form;
      await api.post('/auth/register', { name, email, password });
      navigate('/login', { state: { email, notice: 'Account created. You can now log in.' } });
    } catch (err) {
      // 409 = duplicate email
      if (err.response?.status === 409) setErrors({ email: errorMessage(err) });
      else setErrors({ form: errorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It only takes a minute."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form className="form form-grid" onSubmit={handleSubmit} noValidate>
        {errors.form && <p className="alert alert-error full" role="alert">{errors.form}</p>}
        <div className="full">
          <Field label="Full name" name="name" autoComplete="name" value={form.name} onChange={update} error={errors.name} />
        </div>
        <div className="full">
          <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={update} error={errors.email} />
        </div>
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update}
          error={errors.password}
          hint="At least 8 characters"
        />
        <Field
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={update}
          error={errors.confirm}
        />
        <button className="btn btn-primary btn-block full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
