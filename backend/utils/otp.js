import crypto from 'crypto';

// 6-digit numeric OTP
export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// We never store the raw OTP — only a salted hash of it — same idea as a
// password, so a database leak doesn't leak live OTPs.
export function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

export function otpExpiryDate(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
