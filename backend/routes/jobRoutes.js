import express from 'express';
import {
  listJobs,
  listMyJobs,
  listAppliedJobs,
  getJobById,
  createJob,
} from '../controllers/jobController.js';
import {
  applyToJob,
  getApplicationsForJob,
  getMyApplicationForJob,
} from '../controllers/applicationController.js';
import { markJobDoneAndGenerateQr, getPaymentQr, rateJobAndRecordPerformance } from '../controllers/paymentController.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listJobs);
router.get('/mine', requireAuth, requireRole('employer'), listMyJobs);
router.get('/applied', requireAuth, requireRole('worker'), listAppliedJobs);
router.get('/:id', optionalAuth, getJobById);
router.post('/', requireAuth, requireRole('employer'), createJob);

// Applications
router.post('/:id/apply', requireAuth, requireRole('worker'), applyToJob);
router.get('/:id/applications', requireAuth, requireRole('employer'), getApplicationsForJob);
router.get('/:id/my-application', requireAuth, requireRole('worker'), getMyApplicationForJob);

// Completion & payment
router.post('/:id/complete', requireAuth, requireRole('worker'), markJobDoneAndGenerateQr);
router.get('/:id/qr', requireAuth, getPaymentQr);
router.post('/:id/rate', requireAuth, requireRole('employer'), rateJobAndRecordPerformance);

export default router;
