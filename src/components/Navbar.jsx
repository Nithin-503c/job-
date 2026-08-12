import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          JOB<span className="brand-plus">+</span>
        </Link>
        <div className="nav-links">
          <Link to="/">Browse Jobs</Link>
          {user && <Link to="/my-jobs">My Jobs</Link>}
          {user && <Link to="/profile">Profile</Link>}
          {user ? (
            <>
              <span style={{ opacity: 0.8, fontSize: 13.5 }}>Hi, {user.name}</span>
              <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
            </>
          ) : (
            <Link to="/login">Log in</Link>
          )}
          <Link to="/post-job" className="btn-postjob">Post a Job</Link>
        </div>
      </div>
    </nav>
  );
}
