import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import JobCard from '../components/JobCard';

export default function MyJobs() {
  const { user, jobs } = useApp();
  if (!user) return <Navigate to="/login" replace />;

  const mine = jobs.filter((j) => j.postedBy === user.name);

  return (
    <>
      <h2 className="board-heading">Jobs you've posted</h2>
      {mine.length === 0 ? (
        <div className="empty-state">
          <h3>You haven't pinned anything yet</h3>
          <p>Post a job and it'll show up here.</p>
        </div>
      ) : (
        <div className="board">
          {mine.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </>
  );
}
