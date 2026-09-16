import QRCode from 'qrcode';
import Job from '../models/Job.js';
import User from '../models/User.js';
import WorkerPerformance from '../models/WorkerPerformance.js';

// Builds a standard UPI deep-link ("intent") string. Any UPI app (GPay,
// PhonePe, Paytm...) can scan this and pre-fill the payee, amount and note.
function buildUpiString({ vpa, payeeName, amount, note }) {
  const params = new URLSearchParams({
    pa: vpa, // payee VPA
    pn: payeeName, // payee name
    am: String(amount), // amount
    cu: 'INR',
    tn: note, // transaction note
  });
  return `upi://pay?${params.toString()}`;
}

// POST /api/jobs/:id/complete — worker only, must be the assigned worker.
// Marks the job "completed" and returns a QR code (base64 PNG) that encodes
// a UPI payment request from the customer/employer to the worker.
export const markJobDoneAndGenerateQr = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (!job.assignedWorkerId || String(job.assignedWorkerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the worker assigned to this job can mark it done.' });
    }
    if (job.status !== 'assigned') {
      return res.status(400).json({ message: `Job can't be marked done from status "${job.status}".` });
    }

    job.status = 'completed';
    await job.save();

    const worker = req.user;
    const employer = await User.findById(job.employerId);

    const vpa = worker.upiId || process.env.DEFAULT_UPI_VPA || 'jobplus@upi';
    const upiString = buildUpiString({
      vpa,
      payeeName: worker.name,
      amount: job.pay,
      note: `JOB+ payment for ${job.title}`.slice(0, 50),
    });

    const qrDataUrl = await QRCode.toDataURL(upiString, { width: 320, margin: 1 });

    res.json({
      job,
      qrDataUrl,
      upiString,
      payee: { name: worker.name, vpa },
      payer: employer ? { name: employer.name, email: employer.email } : null,
      amount: job.pay,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark job done', error: err.message });
  }
};

// GET /api/jobs/:id/qr — re-fetch the same QR later (e.g. employer wants to
// scan it from the job page instead of the worker's screen).
export const getPaymentQr = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!['completed', 'paid'].includes(job.status)) {
      return res.status(400).json({ message: 'Worker has not marked this job as done yet.' });
    }

    const worker = await User.findById(job.assignedWorkerId);
    if (!worker) return res.status(404).json({ message: 'Assigned worker not found' });

    const vpa = worker.upiId || process.env.DEFAULT_UPI_VPA || 'jobplus@upi';
    const upiString = buildUpiString({
      vpa,
      payeeName: worker.name,
      amount: job.pay,
      note: `JOB+ payment for ${job.title}`.slice(0, 50),
    });
    const qrDataUrl = await QRCode.toDataURL(upiString, { width: 320, margin: 1 });

    res.json({ qrDataUrl, upiString, amount: job.pay, payee: { name: worker.name, vpa } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch QR', error: err.message });
  }
};

// POST /api/jobs/:id/rate — employer only, after the job is completed/paid.
// Records the worker's performance for this job (feeds future applications'
// "performance" snapshot) and marks the job "paid".
export const rateJobAndRecordPerformance = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (String(job.employerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the employer who posted this job can rate it.' });
    }
    if (!['completed', 'paid'].includes(job.status)) {
      return res.status(400).json({ message: 'Job must be marked done by the worker before rating.' });
    }

    const { rating, feedback } = req.body;
    if (!rating) return res.status(400).json({ message: 'rating is required.' });

    const worker = await User.findById(job.assignedWorkerId);
    if (!worker) return res.status(404).json({ message: 'Assigned worker not found' });

    const record = await WorkerPerformance.create({
      workerId: worker._id,
      workerName: worker.name,
      workerEmail: worker.email,
      jobId: String(job._id),
      jobTitle: job.title,
      category: job.category,
      location: job.location,
      employerName: req.user.name,
      employerId: req.user._id,
      status: 'completed',
      payAmount: job.pay,
      rating,
      feedback,
    });

    job.status = 'paid';
    job.rating = rating;
    await job.save();

    res.status(201).json({ record, job });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record rating', error: err.message });
  }
};
