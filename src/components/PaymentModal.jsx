import { useState } from 'react';

/**
 * PaymentModal — the "receive money" payment platform for JOB+.
 *
 * Two ways to pay the worker are supported:
 *
 * 1. Razorpay Checkout (real gateway):
 *    Razorpay is used because it's the standard, RBI-regulated gateway for
 *    Indian UPI/card/netbanking payments, which fits a daily-wage job app.
 *    Real money movement ALWAYS needs a backend for two reasons:
 *      a) An "order" must be created server-side with your Razorpay Key
 *         Secret (a secret key must never sit in frontend code).
 *      b) The payment signature returned by Razorpay must be verified
 *         server-side before you mark the job as paid, or anyone could
 *         forge a "success" response in the browser.
 *    This component calls POST /api/payments/create-order and expects
 *    { orderId, amount, currency, keyId } back. See README for a minimal
 *    Express reference implementation.
 *
 * 2. Demo / Test Mode:
 *    If no backend is running (this is a frontend-only deliverable), the
 *    component automatically falls back to a simulated gateway so the app
 *    is still fully clickable and demoable end-to-end.
 */
export default function PaymentModal({ job, payerName, onClose, onSuccess }) {
  const [method, setMethod] = useState('razorpay'); // 'razorpay' | 'demo'
  const [status, setStatus] = useState('idle'); // idle | pending | success | error
  const [message, setMessage] = useState('');

  const amountPaise = Math.round(job.pay * 100);

  async function payWithRazorpay() {
    setStatus('pending');
    setMessage('Contacting payment server…');
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountPaise, jobId: job.id }),
      });
      if (!res.ok) throw new Error('no-backend');
      const order = await res.json();

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'JOB+',
        description: job.title,
        order_id: order.orderId,
        handler: function (response) {
          setStatus('success');
          setMessage(`Payment captured. Ref: ${response.razorpay_payment_id}`);
          onSuccess({
            id: response.razorpay_payment_id,
            method: 'razorpay',
            amount: job.pay,
            jobId: job.id,
            jobTitle: job.title,
            payer: payerName,
            payee: job.postedBy,
            time: new Date().toISOString(),
          });
        },
        prefill: { name: payerName },
        theme: { color: '#FF6B35' },
        modal: {
          ondismiss: () => setStatus('idle'),
        },
      });
      rzp.on('payment.failed', function (resp) {
        setStatus('error');
        setMessage(resp?.error?.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      // No backend available in this frontend-only build — fall back to demo mode
      setMethod('demo');
      setStatus('idle');
      setMessage('No payment server detected — switched to Demo Mode. See README to connect a real backend.');
    }
  }

  function payWithDemo() {
    setStatus('pending');
    setMessage('Processing test payment…');
    setTimeout(() => {
      const success = Math.random() > 0.05; // 95% success rate, simulated
      if (success) {
        const record = {
          id: 'demo_' + Date.now(),
          method: 'demo',
          amount: job.pay,
          jobId: job.id,
          jobTitle: job.title,
          payer: payerName,
          payee: job.postedBy,
          time: new Date().toISOString(),
        };
        setStatus('success');
        setMessage(`Test payment successful. Ref: ${record.id}`);
        onSuccess(record);
      } else {
        setStatus('error');
        setMessage('Simulated decline — please try again.');
      }
    }, 1100);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h3>Pay for job</h3>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{job.title} · paying {job.postedBy}</div>
        <div className="amount-display">₹{job.pay.toFixed(2)}</div>

        <div className="pay-methods">
          <button className={method === 'razorpay' ? 'active' : ''} onClick={() => setMethod('razorpay')}>
            Card / UPI (Razorpay)
          </button>
          <button className={method === 'demo' ? 'active' : ''} onClick={() => setMethod('demo')}>
            Demo / Test Mode
          </button>
        </div>

        <button
          className="btn btn-primary btn-block"
          disabled={status === 'pending' || status === 'success'}
          onClick={method === 'razorpay' ? payWithRazorpay : payWithDemo}
        >
          {status === 'pending' ? 'Processing…' : `Pay ₹${job.pay.toFixed(2)}`}
        </button>

        {message && (
          <div className={`pay-status ${status === 'success' ? 'success' : status === 'error' ? 'error' : 'pending'}`}>
            {message}
          </div>
        )}

        <p className="small-note">
          Real payments require a backend that creates a Razorpay order with your
          secret key and verifies the signature after checkout — never put secret
          keys in frontend code. This build auto-falls back to Demo Mode if
          <code> /api/payments/create-order</code> isn't reachable, so you can
          demo the full flow without a server. See README.md for the backend
          reference snippet.
        </p>
      </div>
    </div>
  );
}
