import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const CATEGORIES = ['Babysitting', 'Gardening', 'Event Help', 'Delivery', 'Domestic Help', 'Other'];

export default function PostJob() {
  const { addJob, user } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', category: CATEGORIES[0], location: '', duration: '', pay: '', description: '',
  });

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    addJob({ ...form, pay: Number(form.pay) });
    navigate('/');
  }

  return (
    <div className="card-plain">
      <h2 style={{ fontFamily: 'var(--font-display)' }}>Post a job</h2>
      {!user && (
        <p className="small-note" style={{ marginBottom: 16 }}>
          You're posting as a guest. Log in so workers can see your rating and contact you directly.
        </p>
      )}
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
          <label>Location</label>
          <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Area, City" required />
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
        <button className="btn btn-primary btn-block" type="submit">Pin job to the board</button>
      </form>
    </div>
  );
}
