import Job from '../models/Job.js';
import Application from '../models/Application.js';

// Strips the precise address/coordinates unless the caller is the employer
// who posted the job, or the worker who has been accepted for it. Everyone
// else only sees the coarse public "location" string on the flyer.
function serializeJob(job, requesterId) {
  const obj = job.toObject();
  const isOwner = requesterId && String(job.employerId) === String(requesterId);
  const isAssignedWorker = requesterId && job.assignedWorkerId && String(job.assignedWorkerId) === String(requesterId);

  if (!isOwner && !isAssignedWorker) {
    delete obj.address;
    delete obj.lat;
    delete obj.lng;
  }
  return obj;
}

// GET /api/jobs — public board listing (never includes precise address)
export const listJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs.map((j) => serializeJob(j, null)));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: err.message });
  }
};

// GET /api/jobs/mine — jobs posted by the logged-in employer, full detail
export const listMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs.map((j) => serializeJob(j, req.user._id)));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your jobs', error: err.message });
  }
};

// GET /api/jobs/applied — jobs the logged-in worker has applied to
export const listAppliedJobs = async (req, res) => {
  try {
    const applications = await Application.find({ workerId: req.user._id }).sort({ createdAt: -1 });
    const jobIds = applications.map((a) => a.jobId);
    const jobs = await Job.find({ _id: { $in: jobIds } });
    const jobsById = Object.fromEntries(jobs.map((j) => [String(j._id), j]));

    const result = applications.map((a) => ({
      application: a,
      job: jobsById[String(a.jobId)] ? serializeJob(jobsById[String(a.jobId)], req.user._id) : null,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applied jobs', error: err.message });
  }
};

// GET /api/jobs/:id
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(serializeJob(job, req.user ? req.user._id : null));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job', error: err.message });
  }
};

// POST /api/jobs — employer only
export const createJob = async (req, res) => {
  try {
    const { title, category, location, address, lat, lng, duration, pay, description } = req.body;
    if (!title || !category || !location || !duration || !pay || !description) {
      return res.status(400).json({ message: 'title, category, location, duration, pay and description are required.' });
    }

    const job = await Job.create({
      title,
      category,
      location,
      address: address || location,
      lat,
      lng,
      duration,
      pay: Number(pay),
      description,
      postedBy: req.user.name,
      employerId: req.user._id,
    });

    res.status(201).json(serializeJob(job, req.user._id));
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job', error: err.message });
  }
};
