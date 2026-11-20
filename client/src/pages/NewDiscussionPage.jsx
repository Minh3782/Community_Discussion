import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import Field from '../components/Field';
import '../styles/discussions.css';

/**
 * U3: start a discussion. Opened from a community's list (?community=<id>) the
 * community is preselected; opened from the home screen the user picks one here.
 */
export default function NewDiscussionPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const communityId = searchParams.get('community') || '';

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  const [form, setForm] = useState({ title: '', content: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/communities')
      .then(({ data }) => active && setCommunities(Array.isArray(data) ? data : []))
      .catch((err) => active && setLoadError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [retry]);

  const selected = communities.find((c) => c._id === communityId);
  const backUrl = selected ? `/discussions?community=${encodeURIComponent(communityId)}` : '/discussions';

  function chooseCommunity(event) {
    const next = new URLSearchParams(searchParams);
    if (event.target.value) next.set('community', event.target.value);
    else next.delete('community');
    setSearchParams(next, { replace: true }); // keeps the choice in the URL; typed text is kept
    setErrors({ ...errors, community: '' });
  }

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const errs = {};
    if (!selected) errs.community = 'Choose a community.';
    if (!form.title.trim()) errs.title = 'Enter a title.';
    if (!form.content.trim()) errs.content = 'Write what you want to discuss.';
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setSaving(true);
    try {
      await api.post(`/communities/${encodeURIComponent(communityId)}/discussions`, {
        title: form.title.trim(),
        content: form.content.trim(),
      });
      navigate(backUrl, { replace: true });
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setSaving(false);
    }
  }

  return (
    <>
      <section className="panel panel-welcome">
        <p className="eyebrow">Discussions</p>
        <h1>Start a discussion</h1>
        <p className="muted">Ask a question or share an idea with a community.</p>
      </section>

      <section className="panel panel-form" aria-label="New discussion">
        {loading ? (
          <p className="muted" role="status">Loading communities…</p>
        ) : loadError ? (
          <>
            <p className="alert alert-error" role="alert">{loadError}</p>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { setLoading(true); setLoadError(''); setRetry((n) => n + 1); }}
              >
                Retry
              </button>
              <Link className="btn btn-ghost" to="/discussions">Back to discussions</Link>
            </div>
          </>
        ) : communities.length === 0 ? (
          <div className="empty"><p>No communities are available yet.</p></div>
        ) : (
          <form className="form" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="alert alert-error" role="alert">{errors.form}</p>}
            {communityId && !selected && (
              <p className="alert alert-warn">That community could not be found. Choose another one.</p>
            )}

            <div className={`field ${errors.community ? 'has-error' : ''}`}>
              <label htmlFor="new-discussion-community">Community</label>
              <select
                id="new-discussion-community"
                value={selected ? communityId : ''}
                onChange={chooseCommunity}
                disabled={saving}
              >
                <option value="">Choose a community</option>
                {communities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.community && <small className="field-error">{errors.community}</small>}
            </div>

            <Field label="Title" name="title" value={form.title} onChange={update} error={errors.title} disabled={saving} />

            <div className={`field ${errors.content ? 'has-error' : ''}`}>
              <label htmlFor="new-discussion-content">Content</label>
              <textarea
                id="new-discussion-content"
                name="content"
                rows={6}
                value={form.content}
                onChange={update}
                disabled={saving}
              />
              {errors.content && <small className="field-error">{errors.content}</small>}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Starting discussion…' : 'Start discussion'}
              </button>
              <Link className="btn btn-ghost" to={backUrl}>Cancel</Link>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
