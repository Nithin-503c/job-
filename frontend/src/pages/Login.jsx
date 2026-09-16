import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api';

export default function Login() {
  const { loginWithToken } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setBusy(true);
    try {
      const { token, user } = await api.login({ email, password });
      loginWithToken(token, user);
      navigate('/');
    } catch (err) {
      setError(err.message);
      if (err.data?.needsVerification) setNeedsVerification(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <h2>Log in</h2>
      {error && <p className="pay-status error">{error}</p>}
      {needsVerification && (
        <p className="small-note">
          Finish verifying your email — <Link to="/register">go back to registration</Link> and enter the code sent to {email}.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
