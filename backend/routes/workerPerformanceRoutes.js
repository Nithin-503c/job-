import express from 'express';
import {
  recordWorkerPerformance,
  getWorkerHistory,
  getWorkerAverageRating,
  getAllPerformanceRecords,
  updatePerformanceRecord,
  deletePerformanceRecord,
} from '../controllers/workerPerformanceController.js';

const router = express.Router();

router.post('/', recordWorkerPerformance);
router.get('/', getAllPerformanceRecords);
router.get('/worker/:workerId', getWorkerHistory);
router.get('/worker/:workerId/rating', getWorkerAverageRating);
router.put('/:id', updatePerformanceRecord);
router.delete('/:id', deletePerformanceRecord);

export default router;
