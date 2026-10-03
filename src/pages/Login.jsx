import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('worker');

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    // NOTE: this is a frontend-only demo. A real build should call your
    // backend's /api/auth/login endpoint and store a JWT, per the project
    // synopsis (Authentication: JWT).
    login(email, role);
    navigate('/');
  }

  return (
    <div className="auth-wrap">
      <h2>Log in</h2>
      <div className="role-toggle">
        <button type="button" className={role === 'worker' ? 'active' : ''} onClick={() => setRole('worker')}>
          I'm a Worker
        </button>
        <button type="button" className={role === 'employer' ? 'active' : ''} onClick={() => setRole('employer')}>
          I'm an Employer
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary btn-block" type="submit">Log in</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
