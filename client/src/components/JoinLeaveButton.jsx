import { useState } from 'react';
import api, { errorMessage } from '../api';

/**
 * Join / Leave button for one community (story U1).
 * `member` is controlled by the parent; `onChange(isMember)` is called after the server confirms,
 * and `onError(message)` if the request fails (the button never flips on failure).
 */
export default function JoinLeaveButton({ communityId, member, onChange, onError, size = 'sm' }) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const url = `/communities/${encodeURIComponent(communityId)}/membership`;
      const { data } = member ? await api.delete(url) : await api.post(url);
      onChange(Boolean(data.member));
    } catch (err) {
      onError?.(errorMessage(err, 'Could not update your membership. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn ${member ? 'btn-ghost' : 'btn-primary'} ${size === 'sm' ? 'btn-sm' : ''}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={member}
    >
      {busy ? (member ? 'Leaving…' : 'Joining…') : member ? 'Leave' : 'Join'}
    </button>
  );
}
