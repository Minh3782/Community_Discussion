import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';
import JoinLeaveButton from '../components/JoinLeaveButton';
import '../styles/communities.css';

// Story U1: browse all communities and join or leave them
export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [joined, setJoined] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [{ data: list }, { data: mine }] = await Promise.all([
          api.get('/communities', config),
          api.get('/communities/memberships/mine', config),
        ]);
        if (!Array.isArray(list) || !Array.isArray(mine?.communities)) {
          throw new Error('Unable to read the community list.');
        }
        if (controller.signal.aborted) return;
        setCommunities(list);
        setJoined(new Set(mine.communities));
      } catch (err) {
        if (!controller.signal.aborted) setError(errorMessage(err, 'Unable to load communities.'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [retry]);

  function setMember(id, isMember) {
    setActionError('');
    setJoined((prev) => {
      const next = new Set(prev);
      if (isMember) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <>
      <section className="panel panel-welcome">
        <p className="eyebrow">Communities</p>
        <h1>Browse communities</h1>
        <p className="muted">Join the communities you care about to take part in their discussions.</p>
      </section>

      <section className="panel panel-wide" aria-labelledby="community-list-title">
        <h2 id="community-list-title">All communities</h2>
        {actionError && <p className="alert alert-error" role="alert">{actionError}</p>}

        {loading ? (
          <p className="muted" role="status">Loading communities…</p>
        ) : error ? (
          <div className="stack">
            <p className="alert alert-error" role="alert">{error}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setRetry((n) => n + 1)}>
              Retry
            </button>
          </div>
        ) : communities.length === 0 ? (
          <div className="empty">
            <p>No communities have been created yet.</p>
          </div>
        ) : (
          <div className="community-grid">
            {communities.map((c) => {
              const member = joined.has(c._id);
              return (
                <article key={c._id} className="community-card">
                  <div className="community-card-head">
                    <h3><Link to={`/communities/${encodeURIComponent(c._id)}`}>{c.name}</Link></h3>
                    {member && <span className="member-badge">Joined</span>}
                  </div>
                  <p className="muted community-desc">{c.description || 'No description yet.'}</p>
                  <div className="community-card-foot">
                    <Link className="link-subtle" to={`/communities/${encodeURIComponent(c._id)}`}>View community</Link>
                    <JoinLeaveButton
                      communityId={c._id}
                      member={member}
                      onChange={(isMember) => setMember(c._id, isMember)}
                      onError={setActionError}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
