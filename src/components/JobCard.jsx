import { Link } from 'react-router-dom';

export default function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.id}`} className="flyer">
      <span className="tag">{job.category}</span>
      <h3>{job.title}</h3>
      <div className="meta">📍 {job.location}</div>
      <div className="meta">⏱ {job.duration}</div>
      <div className="pay">₹{job.pay}</div>
      <div className="rating">
        {job.rating ? `★ ${job.rating.toFixed(1)} · posted by ${job.postedBy}` : `New listing · posted by ${job.postedBy}`}
      </div>
    </Link>
  );
}
