import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import ApplicantCard from '../components/ApplicantCard';
import MapEmbed from '../components/MapEmbed';
import QRPayment from '../components/QRPayment';

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useApp();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Worker-side state
  const [myApplication, setMyApplication] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [qr, setQr] = useState(null);

  // Employer-side state
  const [applicants, setApplicants] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);
  const [employerQr, setEmployerQr] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [rating_busy, setRatingBusy] = useState(false);

  const isOwnerEmployer = !!(user && user.role === 'employer' && job && String(job.employerId) === String(user.id));
  const isAssignedWorker = !!(user && user.role === 'worker' && job && job.assignedWorkerId && String(job.assignedWorkerId) === String(user.id));

  const loadJob = useCallback(async () => {
    try {
      const data = await api.getJob(id);
      setJob(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // Worker: check if they've already applied
  useEffect(() => {
    if (!user || user.role !== 'worker' || !job) return;
    api.getMyApplicationForJob(job._id).then(setMyApplication).catch(() => {});
  }, [user, job]);

  // Employer owner: load applicants when job is open
  useEffect(() => {
    if (!isOwnerEmployer || !job || job.status !== 'open') return;
    api.getApplicationsForJob(job._id).then(setApplicants).catch(() => {});
  }, [isOwnerEmployer, job]);

  // Employer owner: once job is completed, fetch the QR so they can pay
  useEffect(() => {
    if (!isOwnerEmployer || !job) return;
    if (!['completed', 'paid'].includes(job.status)) return;
    api.getPaymentQr(job._id).then(setEmployerQr).catch(() => {});
  }, [isOwnerEmployer, job]);

  if (loading) return <div className="empty-state"><p>Loading…</p></div>;

  if (error || !job) {
    return (
      <div className="empty-state">
        <h3>This flyer's been taken down</h3>
        <p>{error || 'That job no longer exists.'} <Link to="/">Back to the board</Link></p>
      </div>
    );
  }

  async function handleApply() {
    setApplying(true);
    setError('');
    try {
      const application = await api.applyToJob(job._id, applyMessage);
      setMyApplication(application);
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  }

  async function handleAccept(applicationId) {
    setAcceptingId(applicationId);
    setError('');
    try {
      const { job: updatedJob } = await api.acceptApplication(applicationId);
      setJob(updatedJob);
      const list = await api.getApplicationsForJob(job._id);
      setApplicants(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleMarkDone() {
    setMarkingDone(true);
    setError('');
    try {
      const result = await api.markJobDone(job._id);
      setJob(result.job);
      setQr(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setMarkingDone(false);
    }
  }

  async function handleRateSubmit(e) {
    e.preventDefault();
    setRatingBusy(true);
    setError('');
    try {
      const { job: updatedJob } = await api.rateJob(job._id, rating, feedback);
      setJob(updatedJob);
    } catch (err) {
      setError(err.message);
    } finally {
      setRatingBusy(false);
    }
  }

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

      {error && <p className="pay-status error">{error}</p>}

      {/* ---------------- WORKER VIEW ---------------- */}
      {user && user.role === 'worker' && (
        <WorkerSection
          job={job}
          isAssignedWorker={isAssignedWorker}
          myApplication={myApplication}
          applyMessage={applyMessage}
          setApplyMessage={setApplyMessage}
          applying={applying}
          onApply={handleApply}
          onMarkDone={handleMarkDone}
          markingDone={markingDone}
          qr={qr}
        />
      )}

      {/* ---------------- EMPLOYER (OWNER) VIEW ---------------- */}
      {isOwnerEmployer && (
        <EmployerSection
          job={job}
          applicants={applicants}
          onAccept={handleAccept}
          acceptingId={acceptingId}
          employerQr={employerQr}
          rating={rating}
          setRating={setRating}
          feedback={feedback}
          setFeedback={setFeedback}
          onRateSubmit={handleRateSubmit}
          ratingBusy={rating_busy}
        />
      )}

      {/* ---------------- LOGGED OUT / OTHER EMPLOYER ---------------- */}
      {!user && (
        <p className="small-note">
          <Link to="/login">Log in</Link> as a worker to apply for this job.
        </p>
      )}
      {user && user.role === 'employer' && !isOwnerEmployer && (
        <p className="small-note">This job was posted by another employer.</p>
      )}
    </div>
  );
}

function WorkerSection({ job, isAssignedWorker, myApplication, applyMessage, setApplyMessage, applying, onApply, onMarkDone, markingDone, qr }) {
  if (job.status === 'open') {
    if (myApplication) {
      return <div className="pay-status pending">Applied ✓ — waiting on the employer to review your profile.</div>;
    }
    return (
      <div>
        <div className="field">
          <label>Message to the employer (optional)</label>
          <textarea rows={3} value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} placeholder="Why you're a good fit…" />
        </div>
        <button className="btn btn-primary" disabled={applying} onClick={onApply}>
          {applying ? 'Applying…' : 'Apply for this job'}
        </button>
      </div>
    );
  }

  if (job.status === 'assigned') {
    if (!isAssignedWorker) {
      return <p className="small-note">This job has already been assigned to another worker.</p>;
    }
    return (
      <div>
        <div className="pay-status success">✓ You've been accepted for this job!</div>
        {job.address && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>📍 {job.address}</h3>
            <MapEmbed address={job.address} lat={job.lat} lng={job.lng} />
          </div>
        )}
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={markingDone} onClick={onMarkDone}>
          {markingDone ? 'Marking done…' : 'Work done — generate payment QR'}
        </button>
      </div>
    );
  }

  if (job.status === 'completed' || job.status === 'paid') {
    if (!isAssignedWorker) return null;
    return (
      <div>
        <div className="pay-status success">✓ Marked as done — waiting for the customer to scan and pay.</div>
        {qr?.qrDataUrl && <div style={{ marginTop: 16 }}><QRPayment qrDataUrl={qr.qrDataUrl} amount={qr.amount} payeeName={qr.payee?.name} /></div>}
        {job.status === 'paid' && <div className="pay-status success" style={{ marginTop: 12 }}>✓ Payment confirmed{job.rating ? ` · rated ${job.rating}★` : ''}.</div>}
      </div>
    );
  }

  return null;
}

function EmployerSection({ job, applicants, onAccept, acceptingId, employerQr, rating, setRating, feedback, setFeedback, onRateSubmit, ratingBusy }) {
  if (job.status === 'open') {
    return (
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12 }}>
          Applicants ({applicants.length})
        </h3>
        {applicants.length === 0 ? (
          <p className="meta">No applicants yet — check back soon.</p>
        ) : (
          <div className="applicant-list">
            {applicants.map((a) => (
              <ApplicantCard
                key={a._id}
                application={a}
                accepting={acceptingId === a._id}
                disabled={acceptingId !== null}
                onAccept={() => onAccept(a._id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (job.status === 'assigned') {
    return <p className="small-note">A worker has been assigned and is on the way. You'll be able to pay once they mark the job done.</p>;
  }

  if (job.status === 'completed' || job.status === 'paid') {
    return (
      <div>
        {employerQr?.qrDataUrl && (
          <div style={{ marginBottom: 20 }}>
            <QRPayment qrDataUrl={employerQr.qrDataUrl} amount={employerQr.amount} payeeName={employerQr.payee?.name} />
          </div>
        )}
        {job.status === 'completed' ? (
          <form onSubmit={onRateSubmit}>
            <label style={{ fontWeight: 700, fontSize: 14 }}>Confirm payment &amp; rate the worker</label>
            <div className="stars" style={{ fontSize: 24, cursor: 'pointer', margin: '8px 0' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} onClick={() => setRating(n)}>{n <= rating ? '★' : '☆'}</span>
              ))}
            </div>
            <div className="field">
              <textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Optional feedback…" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={rating === 0 || ratingBusy}>
              {ratingBusy ? 'Submitting…' : 'Confirm & submit rating'}
            </button>
          </form>
        ) : (
          <p className="pay-status success">✓ Paid and rated {job.rating}★ — thanks!</p>
        )}
      </div>
    );
  }

  return null;
}
