import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PaymentModal from '../components/PaymentModal';

export default function JobDetails() {
  const { id } = useParams();
  const { jobs, user, recordPayment } = useApp();
  const job = jobs.find((j) => j.id === id);

  const [applied, setApplied] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paidRecord, setPaidRecord] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!job) {
    return (
      <div className="empty-state">
        <h3>This flyer's been taken down</h3>
        <p>That job no longer exists. <Link to="/">Back to the board</Link></p>
      </div>
    );
  }

  const isEmployerView = !user || user.role === 'employer';

  return (
    <div className="card-plain">
      <div className="detail-header">
        <div>
          <span className="badge">{job.category}</span>
          <h2 style={{ fontFamily: 'var(--font-display)', margin: '10px 0 4px' }}>{job.title}</h2>
          <div>📍 {job.location} · ⏱ {job.duration}</div>
        </div>
        <div className="pay" style={{ fontSize: 26 }}>₹{job.pay}</div>
      </div>

      <hr className="divider" />
      <p>{job.description}</p>
      <p className="meta">
        Posted by <strong>{job.postedBy}</strong>
        {job.rating ? <span className="stars"> {' '}★ {job.rating.toFixed(1)}</span> : ' (no ratings yet)'}
      </p>

      <hr className="divider" />

      {!paidRecord ? (
        <>
          {!isEmployerView && (
            <button
              className="btn btn-primary"
              disabled={applied}
              onClick={() => setApplied(true)}
            >
              {applied ? 'Applied ✓ — waiting on employer' : 'Apply for this job'}
            </button>
          )}

          {isEmployerView && (
            <>
              <p className="small-note">
                Once the assigned worker finishes the task, confirm completion and
                pay them directly through JOB+.
              </p>
              <button className="btn btn-primary" onClick={() => setShowPayment(true)}>
                Mark complete &amp; pay worker
              </button>
            </>
          )}
        </>
      ) : (
        <div>
          <div className="pay-status success">✓ Paid ₹{paidRecord.amount} to {job.postedBy} · ref {paidRecord.id}</div>

          {!reviewSubmitted ? (
            <div style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 700, fontSize: 14 }}>Rate this job</label>
              <div className="stars" style={{ fontSize: 24, cursor: 'pointer', margin: '8px 0' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} onClick={() => setRating(n)}>{n <= rating ? '★' : '☆'}</span>
                ))}
              </div>
              <button
                className="btn"
                disabled={rating === 0}
                onClick={() => setReviewSubmitted(true)}
              >
                Submit rating
              </button>
            </div>
          ) : (
            <p className="pay-status success" style={{ marginTop: 12 }}>Thanks — your rating of {rating}★ was recorded.</p>
          )}
        </div>
      )}

      {showPayment && (
        <PaymentModal
          job={job}
          payerName={user?.name || 'Employer'}
          onClose={() => setShowPayment(false)}
          onSuccess={(record) => {
            recordPayment(record);
            setPaidRecord(record);
            setShowPayment(false);
          }}
        />
      )}
    </div>
  );
}
