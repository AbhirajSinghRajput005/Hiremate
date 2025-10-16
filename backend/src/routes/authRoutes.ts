import express from 'express';
import { registerUser, loginUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerUser);

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginUser);

// @desc    Get authenticated user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

export default router;
