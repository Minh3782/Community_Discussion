import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import JoinLeaveButton from '../components/JoinLeaveButton';
import '../styles/discussions.css';
import '../styles/communities.css';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

// Story U1: one community with its rules, discussions and a Join / Leave button
export default function CommunityPage() {
  const { communityId } = useParams();
  const [result, setResult] = useState(null);
  const [member, setMember] = useState(false);
  const [actionError, setActionError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };
    const base = `/communities/${encodeURIComponent(communityId)}`;

    async function load() {
      try {
        const [{ data: community }, { data: membership }, { data: discussions }] = await Promise.all([
          api.get(base, config),
          api.get(`${base}/membership`, config),
          api.get(`${base}/discussions`, config),
        ]);
        if (controller.signal.aborted) return;
        setMember(Boolean(membership.member));
        setResult({ communityId, community, discussions: Array.isArray(discussions) ? discussions : [] });
      } catch (err) {
        if (!controller.signal.aborted) {
          setResult({ communityId, error: errorMessage(err, 'Unable to load this community.') });
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [communityId, retry]);

  // Ignore a result that belongs to a previously opened community
  const current = result?.communityId === communityId ? result : null;
  const community = current?.community;

  return (
    <>
      <section className="panel panel-welcome">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Community</p>
            <h1>{community?.name || 'Community'}</h1>
          </div>
          <div className="head-actions">
            <Link className="btn btn-ghost btn-sm" to="/communities">All communities</Link>
            {community && (
              <JoinLeaveButton
                communityId={community._id}
                member={member}
                onChange={(isMember) => { setActionError(''); setMember(isMember); }}
                onError={setActionError}
              />
            )}
          </div>
        </div>
        {!current && <p className="muted" role="status">Loading community…</p>}
        {current?.error && (
          <div className="stack">
            <p className="alert alert-error" role="alert">{current.error}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { setResult(null); setRetry((n) => n + 1); }}>
              Retry
            </button>
          </div>
        )}
        {actionError && <p className="alert alert-error" role="alert">{actionError}</p>}
        {community && (
          <>
            {member && <p><span className="member-badge">You have joined this community</span></p>}
            <p className="muted community-desc-full">{community.description || 'No description yet.'}</p>
          </>
        )}
      </section>

      {community && (
        <>
          <section className="panel panel-rules" aria-labelledby="rules-title">
            <h2 id="rules-title">Community rules</h2>
            <p className="rules-text">{community.rules || 'This community has not set any rules yet.'}</p>
          </section>

          <section className="panel panel-wide" aria-labelledby="posts-title">
            <div className="panel-head">
              <h2 id="posts-title">Discussions</h2>
              <Link className="btn btn-primary btn-sm" to={`/discussions/new?community=${encodeURIComponent(community._id)}`}>
                Start Discussion
              </Link>
            </div>
            {current.discussions.length === 0 ? (
              <div className="empty">
                <p>No discussions have been started in this community yet.</p>
              </div>
            ) : (
              <div className="discussion-grid">
                {current.discussions.map((d) => (
                  <article key={d._id} className="discussion-card">
                    <h3>
                      <Link to={`/discussions/${encodeURIComponent(d._id)}?${new URLSearchParams({ community: community._id })}`}>
                        {d.title}
                      </Link>
                    </h3>
                    <p className="muted discussion-excerpt">{d.content}</p>
                    <p className="discussion-meta">
                      {d.creator?.name || 'Unknown member'}
                      {d.createdAt && <> &middot; {formatDate(d.createdAt)}</>}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
