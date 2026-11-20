import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import '../styles/discussions.css';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export default function DiscussionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const communityId = searchParams.get('community') || '';

  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communitiesError, setCommunitiesError] = useState('');
  const [communitiesRetry, setCommunitiesRetry] = useState(0);

  const [discussionResult, setDiscussionResult] = useState(null);
  const [discussionsRetry, setDiscussionsRetry] = useState(0);

  // Load the available communities.
  useEffect(() => {
    let active = true;

    async function loadCommunities() {
      setCommunitiesLoading(true);
      setCommunitiesError('');

      try {
        const { data } = await api.get('/communities');

        if (!Array.isArray(data)) {
          throw new Error('Unable to read the community list.');
        }

        if (active) {
          setCommunities(data);
        }
      } catch (err) {
        if (active) {
          setCommunitiesError(errorMessage(err));
        }
      } finally {
        if (active) {
          setCommunitiesLoading(false);
        }
      }
    }

    loadCommunities();

    return () => {
      active = false;
    };
  }, [communitiesRetry]);

  // Load discussions belonging to the selected community.
  useEffect(() => {
    if (!communityId) return;

    let active = true;
   

    async function loadDiscussions() {
      try {
        const { data } = await api.get(
          `/communities/${encodeURIComponent(communityId)}/discussions`
        );

        if (!Array.isArray(data)) {
          throw new Error('Unable to read the discussion list.');
        }

        if (active) {
          setDiscussionResult({
            communityId,
            discussions: data,
            error: '',
          });
        }
      } catch (err) {
        if (active) {
          setDiscussionResult({
            communityId,
            discussions: [],
            error: errorMessage(err),
          });
        }
      }
    }

    loadDiscussions();

    return () => {
      active = false;
    };
  }, [communityId, discussionsRetry]);

  function handleCommunityChange(event) {
    setDiscussionResult(null);
    
    const nextParams = new URLSearchParams(searchParams);
    const selectedId = event.target.value;

    if (selectedId) {
      nextParams.set('community', selectedId);
    } else {
      nextParams.delete('community');
    }

    setSearchParams(nextParams);
  }

  const selectedCommunity = communities.find(
    (community) => community._id === communityId
  );

  // Prevent discussions from another community appearing while loading.
  const currentResult =
    discussionResult?.communityId === communityId
      ? discussionResult
      : null;

  return (
    <>
      <section className="panel panel-welcome">
        <p className="eyebrow">Community discussions</p>
        <h1>Discussions</h1>
        <p className="muted">
          Choose a community to browse its conversations.
        </p>
      </section>

      <section className="panel panel-actions">
        <h2>Select a community</h2>

        {communitiesLoading ? (
          <p className="muted" role="status">
            Loading communities…
          </p>
        ) : communitiesError ? (
          <div>
            <p className="alert alert-error" role="alert">
              {communitiesError}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCommunitiesRetry((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        ) : communities.length === 0 ? (
          <p className="muted">No communities are available yet.</p>
        ) : (
          <div className="field community-picker">
            <label htmlFor="discussion-community">Community</label>
            <select
              id="discussion-community"
              value={communityId}
              onChange={handleCommunityChange}
            >
              <option value="">Select a community</option>
              {communities.map((community) => (
                <option key={community._id} value={community._id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <section className="panel panel-actions">
        <div className="panel-head">
          <h2>
            {selectedCommunity
              ? `${selectedCommunity.name} discussions`
              : 'Discussion list'}
          </h2>
          <Link
            className="btn btn-primary btn-sm"
            to={selectedCommunity
              ? `/discussions/new?community=${encodeURIComponent(communityId)}`
              : '/discussions/new'}
          >
            Start Discussion
          </Link>
        </div>

        {!communityId ? (
          <div className="empty">
            <p>Select a community to view its discussions.</p>
          </div>
        ) : !currentResult ? (
          <p className="muted" role="status">
            Loading discussions…
          </p>
        ) : currentResult.error ? (
          <div>
            <p className="alert alert-error" role="alert">
              {currentResult.error}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setDiscussionResult(null);
                setDiscussionsRetry((value) => value + 1);
              }}
            >
              Retry
            </button>
          </div>
        ) : currentResult.discussions.length === 0 ? (
          <div className="empty">
            <p>No discussions have been started in this community yet.</p>
          </div>
        ) : (
          <div className="discussion-grid">
            {currentResult.discussions.map((discussion) => (
              <article key={discussion._id} className="discussion-card">
                <h3>{discussion.title}</h3>
                <p className="muted discussion-excerpt">{discussion.content}</p>
                <p className="discussion-meta">
                  {discussion.creator?.name || 'Unknown member'}
                  {discussion.createdAt && <> &middot; {formatDate(discussion.createdAt)}</>}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}