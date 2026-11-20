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

export default function DiscussionDetailPage() {
  const { discussionId } = useParams();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };

    async function loadDiscussion() {
      try {
        const [{ data: discussion }, { data: posts }] = await Promise.all([
          api.get(`/discussions/${encodeURIComponent(discussionId)}`, config),
          api.get('/posts', { ...config, params: { discussionId } }),
        ]);
        if (!controller.signal.aborted) setResult({ discussionId, discussion, posts });
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({ discussionId, error: errorMessage(err, 'Unable to load this discussion.') });
        }
      }
    }

    void loadDiscussion();
    return () => controller.abort();
  }, [discussionId]);

  const current = result?.discussionId === discussionId ? result : null;
  const discussion = current?.discussion;
  const communityId = discussion?.community || searchParams.get('community');
  const backTo = communityId
    ? `/discussions?${new URLSearchParams({ community: communityId })}`
    : '/discussions';

  return (
    <>
      <section className="panel panel-welcome">
        <div className="panel-head">
          <h1>{discussion?.title || 'Discussion'}</h1>
          <Link className="btn btn-ghost btn-sm" to={backTo}>Back to Discussions</Link>
        </div>
        {!current && <p role="status">Loading discussion...</p>}
        {current?.error && <p className="alert alert-error" role="alert">{current.error}</p>}
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
