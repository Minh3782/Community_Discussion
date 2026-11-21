import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import Field from '../components/Field';
import '../styles/admin-communities.css';

const emptyForm = { name: '', description: '', rules: '' };

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [communityId, setCommunityId] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [success, setSuccess] = useState('');
  const busy = loading || pending || Boolean(loadError);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };
    Promise.all([api.get('/admin/communities', config), api.get('/admin/moderator-candidates', config)])
      .then(([communityResponse, candidateResponse]) => {
        setCommunities(communityResponse.data);
        setCandidates(candidateResponse.data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function save(operation, message) {
    setPending(true);
    setError('');
    setSuccess('');
    try {
      await operation();
      setSuccess(message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  function createCommunity(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setSuccess('');
      setError('Community name is required.');
      return;
    }
    void save(async () => {
      const { data } = await api.post('/admin/communities', form);
      setCommunities((list) => [...list, data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(emptyForm);
    }, 'Community created.');
  }

  function assignModerator(event) {
    event.preventDefault();
    if (!communityId || !userId) {
      setSuccess('');
      setError('Select a community and a moderator.');
      return;
    }
    void save(async () => {
      const { data } = await api.put(`/admin/communities/${communityId}/moderators/${userId}`);
      setCommunities((list) => list.map((item) => item.id === data.id ? data : item));
    }, 'Moderator assigned.');
  }

  function deleteCommunity(id) {
    void save(async () => {
      await api.delete(`/admin/communities/${id}`);
      setCommunities((list) => list.filter((item) => item.id !== id));
      setCommunityId((selected) => selected === id ? '' : selected);
    }, 'Community deleted.');
  }

  return (
    <>
      <div className="admin-communities">
        <h1>Manage Communities</h1>
        <div aria-live="polite">
          {loading && <p>Loading communities and moderators…</p>}
          {success && <p className="alert alert-success">{success}</p>}
        </div>
        {(loadError || error) && <p className="alert alert-error" role="alert">{loadError || error}</p>}

        <div className="admin-communities-grid">
          <div className="admin-communities-left">
            <section className="panel" aria-labelledby="communities-heading">
              <h2 id="communities-heading">Communities</h2>
              <table className="admin-communities-table" aria-labelledby="communities-heading">
                <thead>
                  <tr>
                    <th scope="col">Community Name</th>
                    <th scope="col">Moderator</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {communities.map((community) => (
                    <tr key={community.id}>
                      <td>{community.name}</td>
                      <td>{community.moderators.map((moderator) => moderator.name).join(', ') || '(none)'}</td>
                      <td>
                        <button type="button" className="btn btn-ghost btn-sm" disabled={busy}
                          aria-label={`Delete ${community.name}`} onClick={() => deleteCommunity(community.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && !loadError && communities.length === 0 && (
                    <tr><td colSpan={3}>No communities yet.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="panel" aria-labelledby="assign-heading">
              <h2 id="assign-heading">Assign Moderator</h2>
              <form className="form" onSubmit={assignModerator}>
                <div className="field">
                  <label htmlFor="assign-community">Community</label>
                  <select id="assign-community" value={communityId} required disabled={busy}
                    onChange={(event) => setCommunityId(event.target.value)}>
                    <option value="">Select a community</option>
                    {communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="assign-user">User</label>
                  <select id="assign-user" value={userId} required disabled={busy}
                    onChange={(event) => setUserId(event.target.value)}>
                    <option value="">Select a moderator</option>
                    {candidates.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                  </select>
                </div>
                {!loading && !loadError && candidates.length === 0 && <p className="muted">No eligible moderators are available.</p>}
                <button className="btn btn-primary" type="submit"
                  disabled={busy || !communities.length || !candidates.length}>Assign</button>
              </form>
            </section>
          </div>

          <section className="panel" aria-labelledby="create-heading">
            <h2 id="create-heading">Create Community</h2>
            <form className="form" onSubmit={createCommunity}>
              <Field label="Name" value={form.name} required disabled={busy}
                onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <div className="field">
                <label htmlFor="community-description">Description</label>
                <textarea id="community-description" value={form.description} rows={4} disabled={busy}
                  onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="community-rules">Rules</label>
                <textarea id="community-rules" value={form.rules} rows={4} disabled={busy}
                  onChange={(event) => setForm({ ...form, rules: event.target.value })} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={busy}>Create</button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
