import express from 'express';
import { createJob, getJobs, getJobById, updateJob, deleteJob, applyToJob } from '../controllers/jobController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/:id', getJobById);

// Private routes (protected by JWT)
router.post('/', protect, createJob);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);
router.post('/:id/apply', protect, applyToJob);

export default router;
