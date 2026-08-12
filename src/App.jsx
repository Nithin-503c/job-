import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostJob from './pages/PostJob';
import JobDetails from './pages/JobDetails';
import Profile from './pages/Profile';
import MyJobs from './pages/MyJobs';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-jobs" element={<MyJobs />} />
      </Routes>
      <footer className="site-footer">JOB+ · connecting people to daily work and short-term hires</footer>
    </>
  );
}
