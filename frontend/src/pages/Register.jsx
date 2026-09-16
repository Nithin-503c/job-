import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api';

export default function Register() {
  const { loginWithToken } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'worker' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onPickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleDetailsSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const res = await api.registerInitiate(form);
      setInfo(res.message);
      setDevOtp(res.devOtp || '');
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token, user } = await api.registerVerify({ email: form.email, otp });
      loginWithToken(token, user);

      // Upload the profile photo right after the account is created, if one
      // was chosen during sign-up — builds the worker/employer profile.
      if (photoFile) {
        try {
          const { user: withPhoto } = await api.uploadPhoto(photoFile);
          loginWithToken(token, withPhoto);
        } catch (photoErr) {
          // Non-fatal — they can add a photo later from Profile.
        }
      }

      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError('');
    setBusy(true);
    try {
      const res = await api.registerResend(form.email);
      setInfo(res.message);
      setDevOtp(res.devOtp || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === 'otp') {
    return (
      <div className="auth-wrap">
        <h2>Verify your email</h2>
        <p className="small-note" style={{ marginBottom: 16 }}>
          We sent a 6-digit code to <strong>{form.email}</strong>. Enter it below to activate your account.
        </p>
        {info && <p className="pay-status pending">{info}</p>}
        {devOtp && (
          <div className="dev-otp-box">
            <span className="meta">Dev mode — no email server configured yet. Your code is:</span>
            <div className="dev-otp-code">{devOtp}</div>
            <button
              type="button"
              className="btn"
              style={{ fontSize: 12, padding: '6px 10px' }}
              onClick={() => setOtp(devOtp)}
            >
              Fill it in
            </button>
          </div>
        )}
        {error && <p className="pay-status error">{error}</p>}
        <form onSubmit={handleOtpSubmit}>
          <div className="field">
            <label>Verification code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              required
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || otp.length !== 6}>
            {busy ? 'Verifying…' : 'Verify & create account'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          Didn't get it?{' '}
          <button type="button" onClick={handleResend} disabled={busy} style={{ background: 'none', border: 'none', textDecoration: 'underline', padding: 0, fontWeight: 700 }}>
            Resend code
          </button>
        </p>
      </div>
    );
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

      {error && <p className="pay-status error">{error}</p>}

      <form onSubmit={handleDetailsSubmit}>
        <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <label htmlFor="photo-input" style={{ cursor: 'pointer' }}>
            <div className="avatar avatar-lg" style={{ backgroundImage: photoPreview ? `url(${photoPreview})` : 'none' }}>
              {!photoPreview && '📷'}
            </div>
          </label>
          <div>
            <label htmlFor="photo-input" className="btn" style={{ fontSize: 13, padding: '8px 12px' }}>
              {photoPreview ? 'Change photo' : 'Add profile photo'}
            </label>
            <input id="photo-input" type="file" accept="image/*" onChange={onPickPhoto} style={{ display: 'none' }} />
            <p className="small-note" style={{ margin: '4px 0 0' }}>Shown to employers when you apply for jobs.</p>
          </div>
        </div>

        <div className="field">
          <label>Full name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="field">
          <label>Gmail address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@gmail.com"
            required
          />
          <p className="small-note" style={{ margin: '6px 0 0' }}>We'll send a one-time code here to verify it's really you.</p>
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={6} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Sending code…' : 'Send verification code'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
