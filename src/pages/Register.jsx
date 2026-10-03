import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Register() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'worker' });

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    login(form.email, form.role);
    navigate('/');
  }

  return (
    <div className="auth-wrap">
      <h2>Create your account</h2>
      <div className="role-toggle">
        <button type="button" className={form.role === 'worker' ? 'active' : ''} onClick={() => update('role', 'worker')}>
          Sign up as Worker
        </button>
        <button type="button" className={form.role === 'employer' ? 'active' : ''} onClick={() => update('role', 'employer')}>
          Sign up as Employer
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Full name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
        </div>
        <button className="btn btn-primary btn-block" type="submit">Create account</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
