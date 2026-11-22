import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';

// U4: reload the selected community's published posts whenever this panel opens.
export default function CommunityPosts({ communityId }) {
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPosts() {
      try {
        const { data } = await api.get('/posts', {
          signal: controller.signal,
          timeout: 15000,
          params: { communityId, sort: 'newest' },
        });
        if (!Array.isArray(data)) throw new Error('Invalid post list.');
        if (!controller.signal.aborted) {
          setResult({ communityId, retry, posts: data });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({ communityId, retry, error: errorMessage(err, 'Unable to load community posts.') });
        }
      }
    }

    void loadPosts();
    return () => controller.abort();
  }, [communityId, retry]);

  const current = result?.communityId === communityId && result.retry === retry ? result : null;

  return (
    <section className="panel panel-wide" aria-labelledby="community-posts-heading" aria-busy={!current}>
      <div>
        <h2 id="community-posts-heading">Posts</h2>
        <p className="muted">Newest posts first.</p>
      </div>

      {!current ? (
        <p className="muted" role="status">Loading community posts…</p>
      ) : current.error ? (
        <div className="stack">
          <p className="alert alert-error" role="alert">{current.error}</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setRetry((value) => value + 1)}>
            Retry posts
          </button>
        </div>
      ) : current.posts.length === 0 ? (
        <div className="empty"><p>No posts have been published in this community yet.</p></div>
      ) : (
        <div className="discussion-grid">
          {current.posts.map((post) => (
            <article key={post.id} className="discussion-card">
              <h3>
                <Link to={`/discussions/${encodeURIComponent(post.discussion)}?${new URLSearchParams({ community: communityId })}`}>
                  {post.title}
                </Link>
              </h3>
              <p className="discussion-body">{post.body}</p>
              <p className="discussion-meta">
                {post.author?.name || 'Unknown member'}
                {post.createdAt && (
                  <> &middot; <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString()}</time></>
                )}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
