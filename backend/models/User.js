import mongoose from 'mongoose';

/**
 * User
 * ------
 * Covers both workers and employers. Registration is a two-step flow:
 *   1. POST /api/auth/register/initiate  -> creates a doc with isVerified:false
 *      and emails a 6-digit OTP to the Gmail address given.
 *   2. POST /api/auth/register/verify    -> checks the OTP and flips
 *      isVerified to true, at which point the account can log in.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['worker', 'employer'], required: true },

    // Profile photo (used to build the worker's profile & shown to the
    // employer when the worker applies for a job)
    photoUrl: { type: String, default: '' },

    // Optional UPI VPA an employer can set so the QR generated when a
    // worker marks a job "Work done" points at a real payment target.
    upiId: { type: String, trim: true, default: '' },

    // Email OTP verification
    isVerified: { type: Boolean, default: false },
    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
