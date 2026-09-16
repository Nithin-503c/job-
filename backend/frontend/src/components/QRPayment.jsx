// Displays the UPI QR code generated once the worker marks a job "done", so
// the customer/employer can scan it to pay the worker directly.
export default function QRPayment({ qrDataUrl, amount, payeeName }) {
  return (
    <div className="qr-card">
      <h4 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>Scan to pay {payeeName}</h4>
      <img src={qrDataUrl} alt="UPI payment QR code" width={220} height={220} style={{ borderRadius: 8, border: '2px solid var(--ink)' }} />
      <div className="pay" style={{ fontSize: 22, marginTop: 10 }}>₹{amount}</div>
      <p className="small-note">
        Open any UPI app (Google Pay, PhonePe, Paytm…) and scan this code to pay {payeeName} directly for the completed work.
      </p>
    </div>
  );
}
