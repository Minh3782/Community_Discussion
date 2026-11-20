import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';

export default function DiscussionsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadPosts() {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get('/posts');

        if (!Array.isArray(data)) {
          throw new Error('The discussions response was not a list.');
        }

        if (active) {
          setPosts(data);
        }
      } catch (err) {
        if (active) {
          setError(errorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPosts();

    return () => {
      active = false;
    };
  }, [reload]);

  return (
    <>
      <section
        className="panel panel-welcome"
        aria-labelledby="discussions-title"
      >
        <p className="eyebrow">Community discussions</p>
        <h1 id="discussions-title">Discussions</h1>
        <p className="muted">
          Browse conversations and see what your community is discussing.
        </p>
      </section>

      <section
        className="panel panel-actions"
        aria-label="Discussion list"
        aria-busy={loading}
      >
        {loading && (
          <p className="muted" role="status">
            Loading discussions…
          </p>
        )}

        {!loading && error && (
          <div>
            <p className="alert alert-error" role="alert">
              {error}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setReload((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="empty">
            <p>No discussions have been posted yet.</p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="action-grid">
            {posts.map((post) => (
              <article className="action-card" key={post._id}>
                <h2>{post.title}</h2>
                <p className="muted">{post.body}</p>

                {post.author?.name && (
                  <p className="muted">
                    Posted by {post.author.name}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}