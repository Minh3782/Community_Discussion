import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import api, { errorMessage } from '../api';

export default function NewDiscussionPage() {
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get('community') || '';

  return (
    <NewDiscussionForm
      key={communityId}
      communityId={communityId}
    />
  );
}

function NewDiscussionForm({ communityId }) {
  const navigate = useNavigate();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const backUrl = communityId
    ? `/discussions?community=${encodeURIComponent(communityId)}`
    : '/discussions';

  useEffect(() => {
    if (!communityId) return;

    let active = true;

   

    async function loadCommunity() {
      try {
        const { data } = await api.get(
          `/communities/${encodeURIComponent(communityId)}`
        );

        if (active) {
          setCommunity(data);
        }
      } catch (err) {
        if (active) {
          setLoadError(errorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCommunity();

    return () => {
      active = false;
    };
  }, [communityId, retry]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || community?._id !== communityId) return;

    if (!title.trim() || !content.trim()) {
      setSubmitError('Enter a discussion title and content.');
      return;
    }

    setSaving(true);
    setSubmitError('');

    try {
      await api.post(
        `/communities/${encodeURIComponent(communityId)}/discussions`,
        {
          title: title.trim(),
          content: content.trim(),
        }
      );

      navigate(backUrl, { replace: true });
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!communityId) {
    return (
      <section className="panel panel-actions">
        <h1>Start a discussion</h1>
        <p>Select a community before starting a discussion.</p>
        <Link to="/discussions">Choose a community</Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="panel panel-actions">
        <p role="status">Loading community…</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="panel panel-actions">
        <p className="alert alert-error" role="alert">
          {loadError}
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
  setLoading(true);
  setLoadError('');
  setCommunity(null);
  setTitle('');
  setContent('');
  setSubmitError('');
  setRetry((value) => value + 1);
}}
        >
          Retry
        </button>

        <Link to={backUrl}>Back to discussions</Link>
      </section>
    );
  }

  return (
    <section className="panel panel-actions">
      <h1>Start a discussion</h1>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="new-discussion-community">Community</label>
          <input
            id="new-discussion-community"
            value={community?.name || ''}
            readOnly
          />
          <small className="muted">
            To choose another community, return to the discussion list.
          </small>
        </div>

        <div className="field">
          <label htmlFor="new-discussion-title">Title</label>
          <input
            id="new-discussion-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={saving}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="new-discussion-content">Content</label>
          <textarea
            id="new-discussion-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={6}
            disabled={saving}
            required
          />
        </div>

        {submitError && (
          <p className="alert alert-error" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Starting discussion…' : 'Start discussion'}
        </button>

        <button
          type="button"
          className="btn btn-ghost"
          disabled={saving}
          onClick={() => navigate(backUrl)}
        >
          Cancel
        </button>
      </form>
    </section>
  );
}