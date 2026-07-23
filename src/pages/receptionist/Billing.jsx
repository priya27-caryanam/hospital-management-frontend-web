/**
 * Receptionist Billing Page
 *
 * Handles consultation payment for a completed appointment.
 *
 * Backend endpoints used:
 *   POST /api/receptionists/consultation-payment/{appointmentId}
 *     Body: { paymentMode: "CASH"|"CARD"|"UPI"|"NET_BANKING" }
 *     Response: PaymentResponse { paymentId, amount, paymentMode, paymentStatus, paymentType, transactionId, receiptNumber, paymentDate }
 *
 *   GET /api/receptionists/consultation-receipt/{appointmentId}
 *     Response: ReceiptResponse { receiptNumber, transactionId, amount, paymentMode, paymentType, paymentStatus, paymentDate }
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Receipt,
  Search,
  CreditCard,
  CheckCircle,
  X,
  Printer,
  IndianRupee,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';

const PAYMENT_MODES = ['CASH', 'CARD', 'UPI', 'NET_BANKING'];

const PAYMENT_MODE_LABELS = {
  CASH: '💵 Cash',
  CARD: '💳 Card',
  UPI: '📱 UPI',
  NET_BANKING: '🏦 Net Banking',
};

export default function Billing() {
  const [searchParams] = useSearchParams();
  const initialApptId = searchParams.get('appointmentId') || '';
  const [appointmentId, setAppointmentId] = useState(initialApptId);

  // Receipt fetch state
  const [receipt, setReceipt] = useState(null);
  const [fetching, setFetching] = useState(false);

  // Auto fetch receipt if appointmentId passed in query URL
  useEffect(() => {
    if (initialApptId) {
      fetchReceiptForId(Number(initialApptId));
    }
  }, [initialApptId]);

  const fetchReceiptForId = async (aid) => {
    setFetching(true);
    setReceipt(null);
    setPaymentResult(null);
    try {
      const res = await receptionistApi.consultationReceipt(aid);
      setReceipt(res.data);
      toast.success('Receipt found — payment already processed');
    } catch (err) {
      if (err.response?.status === 404) {
        setReceipt(null);
        toast('No payment recorded yet. Use "Record Payment" below.', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch receipt');
      }
    } finally {
      setFetching(false);
    }
  };

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paying, setPaying] = useState(false);

  // Payment success response state (PaymentResponse object with paymentId)
  const [paymentResult, setPaymentResult] = useState(null);

  // Receipt view modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  /** Fetch existing receipt for appointmentId */
  const handleFetchReceipt = async (e) => {
    e.preventDefault();
    const aid = Number(appointmentId);
    if (!aid) {
      toast.error('Enter a valid Appointment ID');
      return;
    }

    setFetching(true);
    setReceipt(null);
    setPaymentResult(null);
    try {
      const res = await receptionistApi.consultationReceipt(aid);
      setReceipt(res.data);
      toast.success('Receipt found — payment already processed');
    } catch (err) {
      if (err.response?.status === 404) {
        setReceipt(null);
        toast('No payment found. Use "Record Payment" below.', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch receipt');
      }
    } finally {
      setFetching(false);
    }
  };

  /** Process consultation payment: POST /api/receptionists/consultation-payment/{appointmentId} */
  const handleProcessPayment = async () => {
    const aid = Number(appointmentId);
    if (!aid) {
      toast.error('Enter a valid Appointment ID first');
      return;
    }

    setPaying(true);
    try {
      // PaymentRequest: { paymentMode }
      const res = await receptionistApi.consultationPayment(aid, paymentMode);
      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);

      // Store PaymentResponse (includes paymentId)
      setPaymentResult(res.data);

      // Also fetch receipt to update view
      const receiptRes = await receptionistApi.consultationReceipt(aid);
      setReceipt(receiptRes.data);
      setShowReceiptModal(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleString('en-IN') : 'N/A';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consultation Billing</h1>
        <p className="text-sm text-slate-500">
          Look up and process consultation payments by appointment ID
        </p>
      </div>

      {/* Search Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">Look Up Appointment</h3>
        <form onSubmit={handleFetchReceipt} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="number"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              placeholder="Enter Appointment ID"
              className="w-full pl-10 rounded-xl border border-slate-200 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              min="1"
            />
          </div>
          <button
            type="submit"
            disabled={fetching || !appointmentId}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 transition-colors disabled:opacity-50 text-sm"
          >
            {fetching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Payment Receipt Card — shown when already paid */}
      {receipt && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Payment Completed</p>
              <p className="text-xs text-slate-500">Consultation fee has been collected</p>
            </div>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="ml-auto flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              View Receipt
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {paymentResult?.paymentId != null && (
              <div>
                <p className="text-xs text-slate-500 font-medium">Payment ID</p>
                <p className="font-bold text-slate-800">#{paymentResult.paymentId}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 font-medium">Receipt Number</p>
              <p className="font-bold text-slate-800">{receipt.receiptNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Transaction ID</p>
              <p className="font-bold text-slate-800">{receipt.transactionId || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Amount</p>
              <p className="font-bold text-emerald-700 text-lg">
                ₹{receipt.amount != null ? Number(receipt.amount).toLocaleString('en-IN') : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Payment Mode</p>
              <p className="font-bold text-slate-800">{PAYMENT_MODE_LABELS[receipt.paymentMode] || receipt.paymentMode}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Payment Type</p>
              <p className="font-bold text-slate-800">{receipt.paymentType || 'CONSULTATION'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Payment Status</p>
              <p className="font-bold text-emerald-700">{receipt.paymentStatus || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Payment Date</p>
              <p className="font-bold text-slate-800">{formatDate(receipt.paymentDate)}</p>
            </div>
          </div>
        </div>
      )}

      {/* No receipt found — Process Payment section */}
      {!receipt && appointmentId && !fetching && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-blue-600" />
            Process Payment for Appointment #{appointmentId}
          </h3>
          <p className="text-sm text-slate-500">
            No existing payment found. Record the consultation payment below.
          </p>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 transition-colors text-sm"
          >
            <CreditCard className="h-4 w-4" />
            Record Payment
          </button>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Record Consultation Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Select Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                      paymentMode === mode
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {PAYMENT_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={paying}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-60"
              >
                {paying ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {showReceiptModal && receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Payment Receipt</h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 divide-y divide-slate-100 text-sm">
              {[
                ...(paymentResult?.paymentId != null ? [['Payment ID', `#${paymentResult.paymentId}`]] : []),
                ['Receipt Number', receipt.receiptNumber],
                ['Transaction ID', receipt.transactionId],
                ['Amount', receipt.amount != null ? `₹${Number(receipt.amount).toLocaleString('en-IN')}` : '—'],
                ['Payment Mode', PAYMENT_MODE_LABELS[receipt.paymentMode] || receipt.paymentMode],
                ['Payment Type', receipt.paymentType || 'CONSULTATION'],
                ['Status', receipt.paymentStatus],
                ['Date', formatDate(receipt.paymentDate)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-slate-500 font-medium">{label}</span>
                  <span className="font-bold text-slate-800">{value || '—'}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowReceiptModal(false)}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
