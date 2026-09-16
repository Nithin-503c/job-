import WorkerPerformance from '../models/WorkerPerformance.js';

// POST /api/performance
// Called when an employer marks a job complete and rates the worker
export const recordWorkerPerformance = async (req, res) => {
  try {
    const {
      workerId,
      workerName,
      workerEmail,
      jobId,
      jobTitle,
      category,
      location,
      employerName,
      employerId,
      status,
      payAmount,
      rating,
      feedback,
    } = req.body;

    if (!workerId || !workerName || !jobId || !jobTitle || !rating) {
      return res.status(400).json({
        message: 'workerId, workerName, jobId, jobTitle and rating are required.',
      });
    }

    const record = await WorkerPerformance.create({
      workerId,
      workerName,
      workerEmail,
      jobId,
      jobTitle,
      category,
      location,
      employerName,
      employerId,
      status,
      payAmount,
      rating,
      feedback,
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: 'Failed to record worker performance', error: err.message });
  }
};

// GET /api/performance/worker/:workerId
// Full job + rating history for one worker
export const getWorkerHistory = async (req, res) => {
  try {
    const records = await WorkerPerformance.find({ workerId: req.params.workerId }).sort({
      completedAt: -1,
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch worker history', error: err.message });
  }
};

// GET /api/performance/worker/:workerId/rating
// Just the average rating + job count (for showing a star rating on a profile)
export const getWorkerAverageRating = async (req, res) => {
  try {
    const summary = await WorkerPerformance.getAverageRating(req.params.workerId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute average rating', error: err.message });
  }
};

// GET /api/performance
// All records (e.g. for an admin dashboard)
export const getAllPerformanceRecords = async (req, res) => {
  try {
    const records = await WorkerPerformance.find().sort({ completedAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch performance records', error: err.message });
  }
};

// PUT /api/performance/:id
// Edit a rating/feedback after the fact
export const updatePerformanceRecord = async (req, res) => {
  try {
    const updated = await WorkerPerformance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Record not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update record', error: err.message });
  }
};

// DELETE /api/performance/:id
export const deletePerformanceRecord = async (req, res) => {
  try {
    const deleted = await WorkerPerformance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete record', error: err.message });
  }
};
