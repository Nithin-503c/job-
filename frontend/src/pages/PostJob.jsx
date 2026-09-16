import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const CATEGORIES = ['Babysitting', 'Gardening', 'Event Help', 'Delivery', 'Domestic Help', 'Other'];

export default function PostJob() {
  const { addJob, user } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', category: CATEGORIES[0], location: '', address: '', duration: '', pay: '', description: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'employer') {
    return (
      <div className="empty-state">
        <h3>Only employers post jobs</h3>
        <p>You're signed in as a worker — head back to the board to apply for one instead.</p>
      </div>
    );
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await addJob({ ...form, pay: Number(form.pay), address: form.address || form.location });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-plain">
      <h2 style={{ fontFamily: 'var(--font-display)' }}>Post a job</h2>
      {error && <p className="pay-status error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Job title</label>
          <input value={form.title} onChange={(e) => update('title', e.target.value)} required />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Area shown on the board</label>
          <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Area, City" required />
        </div>
        <div className="field">
          <label>Exact address (for the map)</label>
          <input
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Full address — only revealed once you accept a worker"
          />
          <p className="small-note" style={{ margin: '6px 0 0' }}>
            This stays private and only unlocks for the worker you accept, so they can navigate straight there.
          </p>
        </div>
        <div className="field">
          <label>Duration</label>
          <input value={form.duration} onChange={(e) => update('duration', e.target.value)} placeholder="e.g. 4 hrs, 1 day" required />
        </div>
        <div className="field">
          <label>Pay (₹)</label>
          <input type="number" min="1" value={form.pay} onChange={(e) => update('pay', e.target.value)} required />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} required />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Posting…' : 'Pin job to the board'}
        </button>
      </form>
    </div>
  );
}
