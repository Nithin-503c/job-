import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { user, payments } = useApp();
  if (!user) return <Navigate to="/login" replace />;

  const mine = payments.filter((p) => p.payer === user.name || p.payee === user.name);
  const totalReceived = payments.filter((p) => p.payee === user.name).reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter((p) => p.payer === user.name).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="card-plain">
      <h2 style={{ fontFamily: 'var(--font-display)' }}>{user.name}</h2>
      <p className="meta">{user.email} · registered as {user.role}</p>

      <hr className="divider" />
      <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
        <div>
          <div className="meta">Total received</div>
          <div className="pay" style={{ fontSize: 22 }}>₹{totalReceived.toFixed(2)}</div>
        </div>
        <div>
          <div className="meta">Total paid out</div>
          <div className="pay" style={{ fontSize: 22 }}>₹{totalPaid.toFixed(2)}</div>
        </div>
      </div>

      <hr className="divider" />
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Payment history</h3>
      {mine.length === 0 ? (
        <p className="meta">No transactions yet — completed jobs will show up here.</p>
      ) : (
        mine.map((p) => (
          <div key={p.id} className="meta" style={{ padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
            {p.time.slice(0, 10)} · {p.jobTitle} · ₹{p.amount} · {p.method} · ref {p.id}
          </div>
        ))
      )}
    </div>
  );
}
