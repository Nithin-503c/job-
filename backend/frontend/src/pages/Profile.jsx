import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api, API_BASE } from '../api';

export default function Profile() {
  const { user, updateUser } = useApp();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (user) setUpiId(user.upiId || '');
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'worker') return;
    fetch(`${API_BASE}/performance/worker/${user.id}`)
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => {});
    fetch(`${API_BASE}/performance/worker/${user.id}/rating`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  async function onPickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { user: updated } = await api.uploadPhoto(file);
      updateUser(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function saveUpi(e) {
    e.preventDefault();
    setSavingUpi(true);
    setError('');
    try {
      const { user: updated } = await api.updateProfile({ upiId });
      updateUser(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingUpi(false);
    }
  }

  return (
    <div className="card-plain">
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <label htmlFor="profile-photo-input" style={{ cursor: 'pointer' }}>
          <div className="avatar avatar-xl" style={{ backgroundImage: user.photoUrl ? `url(${user.photoUrl})` : 'none' }}>
            {!user.photoUrl && user.name.charAt(0).toUpperCase()}
          </div>
        </label>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 4px' }}>{user.name}</h2>
          <p className="meta" style={{ margin: 0 }}>registered as {user.role}</p>
          <label htmlFor="profile-photo-input" className="btn" style={{ fontSize: 13, padding: '7px 12px', marginTop: 8, display: 'inline-block' }}>
            {uploading ? 'Uploading…' : user.photoUrl ? 'Change photo' : 'Add profile photo'}
          </label>
          <input id="profile-photo-input" type="file" accept="image/*" onChange={onPickPhoto} style={{ display: 'none' }} disabled={uploading} />
        </div>
      </div>

      {error && <p className="pay-status error">{error}</p>}

      <hr className="divider" />

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Payment details</h3>
      <p className="small-note">
        {user.role === 'worker'
          ? 'This UPI ID receives the QR-code payment customers scan when you mark a job "Work done".'
          : 'Workers you hire will see their own UPI ID on the QR code — you don\'t need to set one.'}
      </p>
      {user.role === 'worker' && (
        <form onSubmit={saveUpi} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label>UPI ID</label>
            <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@bank" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={savingUpi}>
            {savingUpi ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      {user.role === 'worker' && (
        <>
          <hr className="divider" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Performance</h3>
          {summary?.averageRating ? (
            <p className="stars" style={{ fontSize: 18 }}>
              ★ {summary.averageRating.toFixed(1)} <span className="meta" style={{ color: 'var(--ink-soft)' }}>· {summary.totalJobs} jobs completed</span>
            </p>
          ) : (
            <p className="meta">No completed jobs yet — ratings will show up here.</p>
          )}
          {history.length > 0 && (
            <div>
              {history.map((h) => (
                <div key={h._id} className="meta" style={{ padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  {String(h.completedAt).slice(0, 10)} · {h.jobTitle} · ★{h.rating} · ₹{h.payAmount} · {h.employerName}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
