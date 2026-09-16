import Application from '../models/Application.js';
import Job from '../models/Job.js';
import WorkerPerformance from '../models/WorkerPerformance.js';

// POST /api/jobs/:id/apply — worker only
// Creates the application with a full snapshot of the worker (photo, name,
// performance history) so the employer sees everything up front.
export const applyToJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ message: 'This job is no longer accepting applicants.' });

    const existing = await Application.findOne({ jobId: job._id, workerId: req.user._id });
    if (existing) return res.status(409).json({ message: 'You already applied to this job.' });

    const perf = await WorkerPerformance.getAverageRating(req.user._id);

    const application = await Application.create({
      jobId: job._id,
      workerId: req.user._id,
      workerName: req.user.name,
      workerPhotoUrl: req.user.photoUrl || '',
      workerEmail: req.user.email,
      message: req.body.message || '',
      averageRating: perf.averageRating,
      totalJobsCompleted: perf.totalJobs,
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Failed to apply', error: err.message });
  }
};

// GET /api/jobs/:id/applications — employer (owner) only
// Full applicant description: photo, name, performance — for the employer
// to review before accepting.
export const getApplicationsForJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (String(job.employerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the employer who posted this job can view applicants.' });
    }

    const applications = await Application.find({ jobId: job._id }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applicants', error: err.message });
  }
};

// GET /api/jobs/:id/my-application — worker checks their own application status
export const getMyApplicationForJob = async (req, res) => {
  try {
    const application = await Application.findOne({ jobId: req.params.id, workerId: req.user._id });
    res.json(application || null);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch application', error: err.message });
  }
};

// POST /api/applications/:applicationId/accept — employer (owner) only
// Accepts one applicant, rejects the rest, assigns the job to the worker.
// From here the worker is unlocked to see the full address/map.
export const acceptApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const job = await Job.findById(application.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (String(job.employerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the employer who posted this job can accept applicants.' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This job already has an assigned worker.' });
    }

    application.status = 'accepted';
    await application.save();

    await Application.updateMany(
      { jobId: job._id, _id: { $ne: application._id } },
      { $set: { status: 'rejected' } }
    );

    job.status = 'assigned';
    job.assignedApplicationId = application._id;
    job.assignedWorkerId = application.workerId;
    await job.save();

    res.json({ application, job });
  } catch (err) {
    res.status(500).json({ message: 'Failed to accept applicant', error: err.message });
  }
};
