# JOB+ Frontend

A React frontend for **JOB+: Connecting People to Daily Work and Short-Term Hires**,
built from the project synopsis (dual-role worker/employer accounts, job board,
matching, ratings, and payments).

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## What's included

- Job board ("corkboard") with search — `src/pages/Home.jsx`
- Post a job — `src/pages/PostJob.jsx`
- Job details with apply / hire / mark-complete flow — `src/pages/JobDetails.jsx`
- Login / Register with worker-or-employer role toggle (`src/pages/Login.jsx`, `Register.jsx`)
- Profile with payment history — `src/pages/Profile.jsx`
- **Payment platform** — `src/components/PaymentModal.jsx`

State is kept in React context (`src/context/AppContext.jsx`) with seed job
data, so the whole app is clickable with no backend running. Wire it up to
your Node/Express + MongoDB + JWT backend (as specified in the synopsis) by
swapping the `login`, `addJob`, and job-fetching logic for real API calls.

## Receiving real money — connecting a backend

The frontend uses **Razorpay Checkout**, the standard gateway for Indian
UPI/card/netbanking payments. Client-side code can only *open* the checkout
widget — it can never safely hold your secret key or decide on its own that a
payment succeeded. You need a small backend with two endpoints:

1. `POST /api/payments/create-order` — creates a Razorpay order using your
   **Key Secret** and returns `{ orderId, amount, currency, keyId }`.
2. `POST /api/payments/verify` — verifies the signature Razorpay sends back
   after checkout, then marks the job as paid in your database.

Minimal Express reference (uses the `razorpay` npm package):

```js
// server.js
import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET, // NEVER expose this in frontend code
});

app.post('/api/payments/create-order', async (req, res) => {
  const { amount, jobId } = req.body; // amount in paise (₹1 = 100)
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `job_${jobId}`,
  });
  res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
});

app.post('/api/payments/verify', (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');
  if (expected === signature) {
    // mark job as paid in MongoDB here
    res.json({ verified: true });
  } else {
    res.status(400).json({ verified: false });
  }
});

app.listen(4000, () => console.log('Payment server on :4000'));
```

Get free test API keys at https://dashboard.razorpay.com (Test Mode) — no
real money moves until you switch to Live Mode with verified KYC.

**If no backend is reachable, `PaymentModal` automatically falls back to a
Demo/Test Mode** that simulates a successful payment, so you can still demo
the entire hire → complete → pay → rate flow for your project evaluation.

## Stack (matches the synopsis)

- Frontend: React.js (Vite), React Router
- Suggested backend: Node.js, Express.js, MongoDB, JWT auth
- Payments: Razorpay Checkout (test or live)
