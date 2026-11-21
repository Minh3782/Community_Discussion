import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import '../styles/discussions.css';

function Byline({ name, date }) {
  return (
    <p className="discussion-meta">
      {name || 'Unknown member'}
      {date && (
        <> &middot; <time dateTime={date}>{new Date(date).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric',
        })}</time></>
      )}
    </p>
  );
}

function loadErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 404) return 'This discussion could not be found. It may have been removed.';
  if (status === 401) return 'Your session has expired. Please log out and sign in again.';
  if (status === 403) return 'You do not have permission to view this discussion.';
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'Loading this discussion took too long. Check your connection and try again.';
  }
  if (!error?.response && error?.request) {
    return 'Unable to load this discussion. Check your internet connection and try again.';
  }
  if (status >= 500) return 'The discussion could not be loaded right now. Please try again.';
  return errorMessage(error, 'Unable to load this discussion. Please try again.');
}

export default function DiscussionDetailPage() {
  const { discussionId } = useParams();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal, timeout: 15000 };

    async function loadDiscussion() {
      try {
        const [{ data: discussion }, { data: posts }] = await Promise.all([
          api.get(`/discussions/${encodeURIComponent(discussionId)}`, config),
          api.get('/posts', { ...config, params: { discussionId } }),
        ]);
        if (!discussion || typeof discussion.title !== 'string' || !Array.isArray(posts)) {
          throw new Error('Invalid discussion response.');
        }
        if (!controller.signal.aborted) setResult({ discussionId, retry, discussion, posts });
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({ discussionId, retry, error: loadErrorMessage(err) });
          controller.abort();
        }
      }
    }

    void loadDiscussion();
    return () => controller.abort();
  }, [discussionId, retry]);

  // A retry or a different discussion must not display an earlier response.
  const current = result?.discussionId === discussionId && result.retry === retry ? result : null;
  const discussion = current?.discussion;
  const communityId = discussion?.community || searchParams.get('community');
  const backTo = communityId
    ? `/discussions?${new URLSearchParams({ community: communityId })}`
    : '/discussions';

  return (
    <>
      <section className="panel panel-welcome" aria-busy={!current}>
        <div className="panel-head">
          <h1>{discussion?.title || 'Discussion'}</h1>
          <Link className="btn btn-ghost btn-sm" to={backTo}>Back to Discussions</Link>
        </div>
        {!current && <p role="status">Loading discussion…</p>}
        {current?.error && (
          <div className="stack">
            <p className="alert alert-error" role="alert">{current.error}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setRetry((value) => value + 1)}>
              Retry
            </button>
          </div>
        )}
        {discussion && (
          <>
            <Byline name={discussion.creator?.name} date={discussion.createdAt} />
            {discussion.content && <p className="discussion-body">{discussion.content}</p>}
          </>
        )}
      </section>

      {discussion && (
        <section className="panel panel-actions" aria-labelledby="discussion-posts-heading">
          <h2 id="discussion-posts-heading">Posts</h2>
          {current.posts.length === 0 ? (
            <div className="empty"><p>No posts yet in this discussion.</p></div>
          ) : (
            current.posts.map((post) => (
              <article key={post.id} className="discussion-card">
                <h3>{post.title}</h3>
                <p className="discussion-body">{post.body}</p>
                <Byline name={post.author?.name} date={post.createdAt} />
              </article>
            ))
          )}
        </section>
      )}
    </>
  );
}
