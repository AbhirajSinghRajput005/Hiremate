import express from 'express';
import { createJob, getJobs, getJobById, updateJob, deleteJob, applyToJob, acceptApplication, rejectApplication, postComment, markJobCompleted } from '../controllers/jobController';
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
router.put('/:jobId/applicants/:applicantId/accept', protect, acceptApplication);
router.put('/:jobId/applicants/:applicantId/reject', protect, rejectApplication);
router.post('/:id/comments', protect, postComment);
router.put('/:id/complete', protect, markJobCompleted);

export default router;
