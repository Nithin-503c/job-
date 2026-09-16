# JOB+ — Full Stack (frontend + backend)

Daily-work job board. Workers apply with a profile photo + performance
history, employers review and accept applicants, the worker gets a map to
the job, and marks it done to generate a UPI QR code the customer scans to
pay.

## What's new in this build

- **Profile photos** — added at sign-up or from the Profile page, shown to
  employers on every application.
- **Display name instead of email** — the navbar and profile show the
  account's name once logged in.
- **Gmail OTP verification** — registration is two steps: enter details →
  a 6-digit code is emailed to the Gmail address given → entering it
  activates the account and logs you in.
- **Full applicant review** — when a worker applies, the employer sees a
  card with the worker's photo, name, message, and performance (average
  rating + jobs completed) before accepting.
- **Map to the job** — once accepted, the worker unlocks the job's exact
  address and an embedded Google Map with a "Get directions" link. The
  address stays hidden from everyone else until then.
- **Work done → QR code** — when the worker finishes, they tap "Work
  done," which generates a UPI QR code (encoding the worker's UPI ID and
  the job's pay) for the employer/customer to scan and pay directly.

## Project layout

```
job-plus-fullstack/
├── backend/     Express + MongoDB API (auth, jobs, applications, QR payments)
└── frontend/    React + Vite client
```

## Running it

### 1. Backend

```bash
cd backend
cp .env.example .env     # then fill in MONGO_URI, JWT_SECRET, Gmail creds
npm install
npm run dev               # http://localhost:5000
```

**Gmail OTP setup:** the OTP email is sent via Gmail SMTP using an **App
Password** (not your normal Gmail password):
1. Enable 2-Step Verification on the Gmail account.
2. Google Account → Security → App passwords → generate one for "Mail".
3. Put the Gmail address in `GMAIL_USER` and the 16-character app password in
   `GMAIL_APP_PASSWORD` in `backend/.env`.

If you don't set those yet, the server still works — it just logs the OTP
to the console, and (while `DEV_EXPOSE_OTP=true`) also returns it in the API
response so you can test registration without email. Turn that flag off
before deploying.

You'll need a MongoDB instance — either local (`mongodb://localhost:27017/job-plus`)
or a free MongoDB Atlas cluster; put its connection string in `MONGO_URI`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

The frontend calls the backend at `http://localhost:5000/api` by default.
To point it elsewhere, create `frontend/.env` with:

```
VITE_API_BASE=https://your-backend-host/api
```

## How the flow works end to end

1. **Sign up** as a worker or employer → verify the Gmail OTP → (optionally)
   add a profile photo.
2. **Employer** posts a job with a public area *and* a private exact
   address.
3. **Worker** browses the board and applies (with an optional message).
4. **Employer** opens the job, sees every applicant's photo, name and
   performance history, and accepts one.
5. **Worker** now sees the unlocked address + map and directions link.
6. **Worker** finishes the work and taps "Work done" → a UPI QR code is
   generated for the job's pay.
7. **Employer/customer** scans the QR with any UPI app to pay the worker
   directly, then confirms the payment and rates the worker in the app —
   this feeds the worker's performance history for future applications.

## Notes on the payment QR

The QR encodes a standard `upi://pay?...` deep link with the worker's UPI
ID (set on their Profile page), the job's pay amount, and a note. Any UPI
app (Google Pay, PhonePe, Paytm, etc.) can scan and pre-fill the payment.
If a worker hasn't set a UPI ID yet, the QR falls back to `DEFAULT_UPI_VPA`
from `backend/.env` so the flow still demos end-to-end.
