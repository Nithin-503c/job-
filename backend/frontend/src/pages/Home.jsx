import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import JobCard from '../components/JobCard';

export default function Home() {
  const { jobs } = useApp();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.category.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
    );
  }, [jobs, query]);

  return (
    <>
      <section className="hero">
        <h1>Daily work, <span>right nearby.</span></h1>
        <p>
          JOB+ connects people looking for short-term work with employers who need
          help today — babysitting, gardening, event help, delivery, and more.
        </p>
        <div className="search-bar">
          <input
            placeholder="Search by job, category, or area…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      <h2 className="board-heading">Pinned on the board</h2>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No jobs match that search</h3>
          <p>Try a different keyword, or be the first to post one nearby.</p>
        </div>
      ) : (
        <div className="board">
          {filtered.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}
    </>
  );
}
