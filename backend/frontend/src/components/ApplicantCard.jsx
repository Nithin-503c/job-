// Shown to the employer for each worker who applied — photo, name and
// performance history up front, plus an Accept action.
export default function ApplicantCard({ application, onAccept, accepting, disabled }) {
  const { workerName, workerPhotoUrl, workerEmail, message, averageRating, totalJobsCompleted, status } = application;

  return (
    <div className={`applicant-card ${status !== 'pending' ? 'applicant-' + status : ''}`}>
      <div className="avatar avatar-lg" style={{ backgroundImage: workerPhotoUrl ? `url(${workerPhotoUrl})` : 'none' }}>
        {!workerPhotoUrl && workerName.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 16 }}>{workerName}</strong>
          {averageRating ? (
            <span className="stars">★ {averageRating.toFixed(1)} <span className="meta">· {totalJobsCompleted} jobs done</span></span>
          ) : (
            <span className="meta">New worker · no ratings yet</span>
          )}
        </div>
        <div className="meta">{workerEmail}</div>
        {message && <p style={{ margin: '8px 0 0', fontSize: 14 }}>{message}</p>}

        {status === 'pending' && (
          <button className="btn btn-primary" style={{ marginTop: 10 }} disabled={disabled || accepting} onClick={onAccept}>
            {accepting ? 'Accepting…' : 'Accept this worker'}
          </button>
        )}
        {status === 'accepted' && <div className="pay-status success" style={{ marginTop: 10 }}>✓ Accepted</div>}
        {status === 'rejected' && <div className="meta" style={{ marginTop: 10 }}>Not selected</div>}
      </div>
    </div>
  );
}
