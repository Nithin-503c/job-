import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import JobCard from '../components/JobCard';

const STATUS_LABEL = {
  open: 'Open — awaiting applicants',
  assigned: 'Worker assigned',
  completed: 'Marked done — payment pending',
  paid: 'Paid & rated',
};

export default function MyJobs() {
  const { user } = useApp();
  const [jobs, setJobs] = useState([]);
  const [applied, setApplied] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    if (user.role === 'employer') {
      api.listMyJobs().then(setJobs).finally(() => setLoading(false));
    } else {
      api.listAppliedJobs().then(setApplied).finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'employer') {
    return (
      <>
        <h2 className="board-heading">Jobs you've posted</h2>
        {loading ? (
          <p className="meta" style={{ padding: '0 20px' }}>Loading…</p>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <h3>You haven't pinned anything yet</h3>
            <p>Post a job and it'll show up here.</p>
          </div>
        ) : (
          <div className="board">
            {jobs.map((job) => (
              <div key={job._id} style={{ position: 'relative' }}>
                <JobCard job={{ ...job, id: job._id }} />
                <span className="status-pill">{STATUS_LABEL[job.status] || job.status}</span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <h2 className="board-heading">Jobs you've applied to</h2>
      {loading ? (
        <p className="meta" style={{ padding: '0 20px' }}>Loading…</p>
      ) : applied.length === 0 ? (
        <div className="empty-state">
          <h3>No applications yet</h3>
          <p>Browse the board and apply for a job that fits.</p>
        </div>
      ) : (
        <div className="board">
          {applied.map(({ application, job }) =>
            job ? (
              <div key={application._id} style={{ position: 'relative' }}>
                <JobCard job={{ ...job, id: job._id }} />
                <span className="status-pill">
                  {application.status === 'accepted' ? STATUS_LABEL[job.status] || 'Accepted' : application.status === 'rejected' ? 'Not selected' : 'Application pending'}
                </span>
              </div>
            ) : (
              <div key={application._id} className="flyer">
                <h3>{application.workerName ? application.jobTitle : 'Job removed'}</h3>
                <p className="meta"><Link to="/">Back to the board</Link></p>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}
