import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
  return transporter;
}

/**
 * Sends the OTP email via Gmail SMTP. If Gmail credentials aren't configured
 * (e.g. local dev without a .env yet), it just logs the OTP to the console
 * instead of throwing, so the rest of the app still runs.
 */
export async function sendOtpEmail(toEmail, otp) {
  const t = getTransporter();

  if (!t) {
    console.log(`[DEV] Gmail not configured. OTP for ${toEmail} is: ${otp}`);
    return { delivered: false };
  }

  await t.sendMail({
    from: `"JOB+" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your JOB+ verification code',
    text: `Your JOB+ verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:auto">
        <h2 style="color:#FF6B35">JOB+</h2>
        <p>Your verification code is:</p>
        <p style="font-size:32px;font-weight:800;letter-spacing:6px">${otp}</p>
        <p style="color:#666">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });

  return { delivered: true };
}
