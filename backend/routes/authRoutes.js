import express from 'express';
import {
  initiateRegister,
  verifyRegister,
  resendOtp,
  login,
  getMe,
  updateProfile,
  uploadProfilePhoto,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';

const router = express.Router();

// Registration — Gmail OTP two-step flow
router.post('/register/initiate', initiateRegister);
router.post('/register/verify', verifyRegister);
router.post('/register/resend', resendOtp);

router.post('/login', login);

router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);
router.post('/photo', requireAuth, uploadPhoto.single('photo'), uploadProfilePhoto);

export default router;
