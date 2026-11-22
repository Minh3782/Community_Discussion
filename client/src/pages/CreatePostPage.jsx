import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api';
import Field from '../components/Field';
import '../styles/create-post.css';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [discussionId, setDiscussionId] = useState('');
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadDiscussions() {
      try {
        const { data } = await api.get('/discussions', { signal: controller.signal });
        // The list supplies the community for each discussion the user can post to.
        if (!Array.isArray(data) || data.some((item) =>
          !item || typeof item.id !== 'string' || !item.id.trim() ||
          typeof item.title !== 'string' || !item.title.trim() ||
          typeof item.community?.id !== 'string' || !item.community.id.trim() ||
          typeof item.community.name !== 'string' || !item.community.name.trim()
        )) {
          setLoadError('The discussion list could not be read. Try again later.');
          return;
        }
        setDiscussions(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error.response?.status === 404
            ? 'The discussion list is currently unavailable. Publishing requires a discussion.'
            : errorMessage(error, 'Could not load discussions.'));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDiscussions();
    return () => controller.abort();
  }, []);

  const communities = [...new Map(discussions.map(({ community }) => [community.id, community])).values()];
  const choices = discussions.filter((discussion) => discussion.community.id === communityId);
  const selected = choices.find((discussion) => discussion.id === discussionId);

  async function publish(event) {
    event.preventDefault();
    if (loading || loadError || publishing) return;
    setPublishError('');

    if (!title.trim() || !content.trim() || !selected) {
      setPublishError('Enter a title and content, and select a community and discussion.');
      return;
    }

    setPublishing(true);
    try {
      const response = await api.post('/posts', {
        title: title.trim(),
        body: content.trim(),
        discussionId: selected.id,
      });
      if (response.status !== 201) {
        setPublishError('The server did not confirm publication.');
        return;
      }
      // U4: opening the community reloads its Posts panel after publication.
      navigate(`/communities/${encodeURIComponent(selected.community.id)}`, {
        state: { publishedCommunityId: selected.community.id },
      });
    } catch (error) {
      setPublishError(errorMessage(error, 'Could not publish the post.'));
    } finally {
      setPublishing(false);
    }
  }

  return (
      <section className="panel create-post" aria-labelledby="create-post-heading">
        <h1 id="create-post-heading">Create a Post</h1>
        {loading && <p role="status">Loading discussions…</p>}
        {loadError && <p className="alert alert-error" role="alert">{loadError}</p>}
        {!loading && !loadError && !discussions.length && (
          <div>
            <p role="status">You can post in discussions from communities you have joined. No eligible discussions are available.</p>
            <Link to="/discussions">Browse discussions</Link>
          </div>
        )}
        {publishError && <p className="alert alert-error" role="alert">{publishError}</p>}

        <form className="form" onSubmit={publish}>
          <Field label="Title" value={title} onChange={(event) => setTitle(event.target.value)}
            disabled={publishing} required />

          <div className="field">
            <label htmlFor="post-community">Community</label>
            <select id="post-community" value={communityId} required
              disabled={publishing || !communities.length}
              onChange={(event) => {
                setCommunityId(event.target.value);
                setDiscussionId('');
              }}>
              <option value="">Select a community</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>{community.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="post-discussion">Discussion</label>
            <select id="post-discussion" value={discussionId} required
              disabled={publishing || !choices.length}
              onChange={(event) => setDiscussionId(event.target.value)}>
              <option value="">Select a discussion</option>
              {choices.map((discussion) => (
                <option key={discussion.id} value={discussion.id}>{discussion.title}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="post-content">Content</label>
            <textarea id="post-content" value={content} rows={7} required disabled={publishing}
              onChange={(event) => setContent(event.target.value)} />
          </div>

          <div className="create-post-actions">
            <button type="submit" className="btn btn-primary"
              disabled={loading || Boolean(loadError) || publishing || !selected}>
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
            <button type="button" className="btn btn-ghost" disabled={publishing}
              onClick={() => navigate('/home')}>Cancel</button>
          </div>
        </form>
      </section>
  );
}
