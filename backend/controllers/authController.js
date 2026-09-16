import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateOtp, hashOtp, otpExpiryDate } from '../utils/otp.js';
import { sendOtpEmail } from '../utils/sendEmail.js';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    photoUrl: user.photoUrl || '',
    upiId: user.upiId || '',
    isVerified: user.isVerified,
  };
}

// STEP 1 — POST /api/auth/register/initiate
// Creates (or reuses) an unverified account and emails a Gmail OTP.
export const initiateRegister = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required.' });
    }
    if (!['worker', 'employer'].includes(role)) {
      return res.status(400).json({ message: 'role must be "worker" or "employer".' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified) {
      return res.status(409).json({ message: 'An account with this email already exists. Please log in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    if (user) {
      // Re-registering before verifying — update details & resend OTP
      user.name = name;
      user.passwordHash = passwordHash;
      user.role = role;
      user.otpHash = hashOtp(otp);
      user.otpExpiresAt = otpExpiryDate();
      user.otpAttempts = 0;
      await user.save();
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash,
        role,
        isVerified: false,
        otpHash: hashOtp(otp),
        otpExpiresAt: otpExpiryDate(),
      });
    }

    const { delivered } = await sendOtpEmail(normalizedEmail, otp);

    const devExposeOtp = String(process.env.DEV_EXPOSE_OTP).toLowerCase() === 'true';
    res.status(200).json({
      message: delivered
        ? `A 6-digit code was sent to ${normalizedEmail}.`
        : `Email isn't configured on this server yet, so the code was logged to the server console instead.`,
      email: normalizedEmail,
      ...(devExposeOtp ? { devOtp: otp } : {}),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    res.status(500).json({ message: 'Failed to start registration', error: err.message });
  }
};

// STEP 2 — POST /api/auth/register/verify
// Confirms the OTP and activates the account, returning a JWT.
export const verifyRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'email and otp are required.' });
    const cleanOtp = String(otp).trim();

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.otpHash) {
      return res.status(400).json({ message: 'No pending verification for this email. Please register again.' });
    }
    if (user.isVerified) {
      return res.status(409).json({ message: 'This account is already verified. Please log in.' });
    }
    if (!user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Code expired. Please request a new one.' });
    }
    if (user.otpAttempts >= 5) {
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }
    if (hashOtp(cleanOtp) !== user.otpHash) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: 'Incorrect code. Please try again.' });
    }

    user.isVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify code', error: err.message });
  }
};

// POST /api/auth/register/resend — request a fresh OTP for a pending account
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').trim().toLowerCase() });
    if (!user || user.isVerified) {
      return res.status(400).json({ message: 'No pending verification for this email.' });
    }
    const otp = generateOtp();
    user.otpHash = hashOtp(otp);
    user.otpExpiresAt = otpExpiryDate();
    user.otpAttempts = 0;
    await user.save();

    const { delivered } = await sendOtpEmail(user.email, otp);
    const devExposeOtp = String(process.env.DEV_EXPOSE_OTP).toLowerCase() === 'true';
    res.json({
      message: delivered ? 'A new code was sent.' : 'Email not configured — code logged on the server console.',
      ...(devExposeOtp ? { devOtp: otp } : {}),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend code', error: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password are required.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email first.',
        needsVerification: true,
        email: user.email,
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

// PUT /api/auth/profile — update name / UPI id
export const updateProfile = async (req, res) => {
  try {
    const { name, upiId } = req.body;
    if (name) req.user.name = name;
    if (upiId !== undefined) req.user.upiId = upiId;
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// POST /api/auth/photo — multipart upload, field name "photo"
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No photo uploaded.' });

    const base = process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    req.user.photoUrl = `${base}/uploads/${req.file.filename}`;
    await req.user.save();

    res.json({ user: publicUser(req.user) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload photo', error: err.message });
  }
};
