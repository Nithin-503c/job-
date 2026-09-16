import express from 'express';
import { acceptApplication } from '../controllers/applicationController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST /api/applications/:applicationId/accept
router.post('/:applicationId/accept', requireAuth, requireRole('employer'), acceptApplication);

export default router;
