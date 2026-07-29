/**
 * Pending Prescriptions Queue & Pharmacy Operations Page (Pharmacist)
 *
 * Implements:
 *   - GET /api/pharmacy/pending-prescriptions — View pending prescriptions queue
 *   - POST /api/pharmacy/dispense/{prescriptionId}?pharmacistId={pharmacistId} — Dispense medications
 *   - POST /api/pharmacy/payment/{prescriptionId} — Process pharmacy payment
 *   - GET /api/pharmacy/receipt/{prescriptionId} — Fetch pharmacy payment receipt
 *
 * Swagger Response Schemas:
 *   PaymentResponse: { paymentId, amount, paymentMode, paymentStatus, paymentType, transactionId, receiptNumber, paymentDate }
 *   ReceiptResponse: { receiptNumber, transactionId, amount, paymentMode, paymentType, paymentStatus, paymentDate }
 *   PrescriptionResponse: { prescriptionId, appointmentId, patientName, doctorName, diagnosis, medicines: [...], instructions, status, createdAt }
 */
import { useState, useEffect } from 'react';
import { Pill, CheckCircle, Eye, RefreshCw, CreditCard, Receipt, X } from 'lucide-react';
import toast from 'react-hot-toast';
import pharmacyApi from '../../api/pharmacyApi';
import prescriptionApi from '../../api/prescriptionApi';
import appointmentApi from '../../api/appointmentApi';
import patientApi from '../../api/patientApi';
import doctorApi from '../../api/doctorApi';
import DataTable from '../../components/common/DataTable';
import ViewPrescriptionModal from '../../components/common/ViewPrescriptionModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const isRealName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (
    lower === 'patient' ||
    lower === 'doctor' ||
    lower === 'dr. doctor' ||
    lower === '—' ||
    lower.startsWith('appt #') ||
    lower.startsWith('patient #') ||
    lower.startsWith('doctor #')
  ) {
    return false;
  }
  return true;
};

export default function PendingPrescriptions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | DISPENSED | ALL
  const [prescriptions, setPrescriptions] = useState([]);
  const [dispensedList, setDispensedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispensingId, setDispensingId] = useState(null);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);

  // Pharmacy Payment Modal state (POST /api/pharmacy/payment/{prescriptionId})
  const [paymentRxId, setPaymentRxId] = useState(null);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentResult, setPaymentResult] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Pharmacy Receipt Modal state (GET /api/pharmacy/receipt/{prescriptionId})
  const [receiptRxId, setReceiptRxId] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        pharmacyApi.getPendingPrescriptions().catch(() => ({ data: [] })),
        prescriptionApi.getAll().catch(() => ({ data: [] })),
      ]);

      const pending = pendingRes.data || [];
      const allRx = allRes.data || [];

      const localApptNames = JSON.parse(localStorage.getItem('hms_appointment_names') || '{}');

      const enrichItem = (rx) => {
        const id = rx.prescriptionId || rx.id;
        const apptId = rx.appointmentId || id;
        const cached = localApptNames[apptId] || localApptNames[id] || {};

        let pName = rx.patientName || (rx.patient ? `${rx.patient.firstName || ''} ${rx.patient.lastName || ''}`.trim() : '');
        let dName = rx.doctorName || (rx.doctor ? `${rx.doctor.firstName || ''} ${rx.doctor.lastName || ''}`.trim() : '');

        if (!isRealName(pName) && cached.patientName) pName = cached.patientName;
        if (!isRealName(dName) && cached.doctorName) dName = cached.doctorName;

        return {
          ...rx,
          prescriptionId: id,
          patientName: isRealName(pName) ? pName : `Patient #${rx.patientId || apptId}`,
          doctorName: isRealName(dName) ? (dName.startsWith('Dr.') ? dName : `Dr. ${dName}`) : `Dr. #${rx.doctorId || apptId}`,
        };
      };

      const enrichedPending = pending.map(enrichItem);

      // Backend dispensed or completed prescriptions
      const backendDispensed = allRx.filter((r) => r.status === 'DISPENSED' || r.status === 'COMPLETED');
      const localDispensed = JSON.parse(localStorage.getItem('hms_dispensed_prescriptions') || '[]');

      // Merge backend and local dispensed without duplicates
      const dispensedMap = new Map();
      [...backendDispensed, ...localDispensed].forEach((item) => {
        const id = item.prescriptionId || item.id;
        if (id && !dispensedMap.has(id)) {
          const enriched = enrichItem(item);
          dispensedMap.set(id, {
            ...enriched,
            status: item.status || 'DISPENSED',
          });
        }
      });

      setPrescriptions(enrichedPending);
      setDispensedList(Array.from(dispensedMap.values()));
    } catch (err) {
      console.error('Failed to load prescriptions queue:', err);
      toast.error('Failed to load prescriptions queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);


  /** Dispense via POST /api/pharmacy/dispense/{prescriptionId}?pharmacistId={pharmacistId} */
  const handleDispense = async (prescriptionId) => {
    setDispensingId(prescriptionId);
    try {
      const pharmacistId = user?.userId || user?.id || 1;
      await pharmacyApi.dispense(prescriptionId, pharmacistId);
      toast.success(`Prescription #${prescriptionId} medications dispensed successfully!`);

      // Add to local dispensed history list so pharmacist can see who received medicines
      const rx = prescriptions.find((p) => (p.prescriptionId || p.id) === prescriptionId);
      if (rx) {
        const dispensedRecord = {
          ...rx,
          status: 'DISPENSED',
          dispensedAt: new Date().toISOString(),
          pharmacistName: user?.name || 'Pharmacist',
        };
        const currentDispensed = JSON.parse(localStorage.getItem('hms_dispensed_prescriptions') || '[]');
        if (!currentDispensed.some((d) => (d.prescriptionId || d.id) === prescriptionId)) {
          const updated = [dispensedRecord, ...currentDispensed];
          localStorage.setItem('hms_dispensed_prescriptions', JSON.stringify(updated));
          setDispensedList(updated);
        }
      }

      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to dispense medication');
    } finally {
      setDispensingId(null);
    }
  };

  /** Process Payment via POST /api/pharmacy/payment/{prescriptionId} */
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!paymentRxId) return;

    setProcessingPayment(true);
    try {
      const res = await pharmacyApi.payment(paymentRxId, paymentMode);
      setPaymentResult(res.data);
      toast.success('Pharmacy payment processed successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Pharmacy payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  /** Fetch Receipt via GET /api/pharmacy/receipt/{prescriptionId} */
  const handleViewReceipt = async (rxId) => {
    setReceiptRxId(rxId);
    setLoadingReceipt(true);
    setReceiptData(null);
    try {
      const res = await pharmacyApi.receipt(rxId);
      setReceiptData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Pharmacy receipt not found for this prescription ID.');
    } finally {
      setLoadingReceipt(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  /** Columns rendering 100% of PrescriptionResponse fields */
  const columns = [
    { header: 'Rx ID', accessor: 'prescriptionId' },
    { header: 'Appt ID', accessor: 'appointmentId' },
    { header: 'Patient Name', accessor: 'patientName' },
    { header: 'Doctor Name', accessor: 'doctorName' },
    {
      header: 'Diagnosis',
      render: (row) => (
        <span className="font-semibold text-blue-600 text-xs truncate max-w-[140px] block" title={row.diagnosis}>
          {row.diagnosis || '—'}
        </span>
      ),
    },
    {
      header: 'Medicines',
      render: (row) => (
        <div className="text-xs space-y-1">
          {(row.medicines || []).map((m, idx) => (
            <div key={idx} className="font-medium text-slate-700 text-[11px]">
              • <span className="font-bold">{m.medicineName}</span> (Qty: {m.quantity}, {m.dosage}{m.frequency ? `, ${m.frequency}` : ''}{m.duration ? `, ${m.duration}` : ''})
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'Prescribed Date',
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {formatDate(row.createdAt || row.dispensedAt)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
            row.status === 'DISPENSED'
              ? 'bg-emerald-100 text-emerald-700'
              : row.status === 'ISSUED'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {row.status || 'PENDING'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => {
        const id = row.prescriptionId || row.id;
        const isDispensed = row.status === 'DISPENSED';
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedPrescriptionId(id)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
              title="View Prescription Details"
            >
              <Eye className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                setPaymentRxId(id);
                setPaymentResult(null);
                setPaymentMode('CASH');
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 text-xs font-semibold transition-colors"
              title="Process Payment"
            >
              <CreditCard className="h-3.5 w-3.5" /> Pay Bill
            </button>

            <button
              onClick={() => handleViewReceipt(id)}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-semibold transition-colors"
              title="View Receipt"
            >
              <Receipt className="h-3.5 w-3.5" /> Receipt
            </button>

            {!isDispensed && (
              <button
                onClick={() => handleDispense(id)}
                disabled={dispensingId === id}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1 text-xs transition-colors disabled:opacity-50 shadow-xs"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {dispensingId === id ? 'Dispensing...' : 'Dispense'}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const displayedData =
    activeTab === 'PENDING'
      ? prescriptions
      : activeTab === 'DISPENSED'
      ? dispensedList
      : [...prescriptions, ...dispensedList];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="h-7 w-7 text-emerald-600" />
            Pharmacy Prescriptions Management
          </h1>
          <p className="text-sm text-slate-500">
            Review prescriptions, process pharmacy payments, and view dispensed medications history
          </p>
        </div>
        <button
          onClick={fetchPrescriptions}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Queue
        </button>
      </div>

      {/* Status Tabs: Pending / Dispensed / All */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'PENDING'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Pending Queue ({prescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('DISPENSED')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'DISPENSED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Dispensed / Completed ({dispensedList.length})
        </button>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Prescriptions ({prescriptions.length + dispensedList.length})
        </button>
      </div>

      <DataTable
        columns={columns}
        data={displayedData}
        loading={loading}
        emptyMessage={
          activeTab === 'DISPENSED'
            ? 'No dispensed prescriptions recorded yet.'
            : 'No pending prescriptions in queue.'
        }
      />


      {/* ─── View Prescription Details Modal ─── */}
      {selectedPrescriptionId && (
        <ViewPrescriptionModal
          prescriptionId={selectedPrescriptionId}
          isOpen={!!selectedPrescriptionId}
          onClose={() => setSelectedPrescriptionId(null)}
        />
      )}

      {/* ─── Process Pharmacy Payment Modal (POST /api/pharmacy/payment/{prescriptionId}) ─── */}
      {paymentRxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                Process Pharmacy Payment for Rx #{paymentRxId}
              </h3>
              <button onClick={() => setPaymentRxId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">CARD</option>
                  <option value="NET_BANKING">NET BANKING</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentRxId(null)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {processingPayment ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>

            {/* Payment Response (100% PaymentResponse Mapping) */}
            {paymentResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 text-xs animate-fade-in">
                <p className="font-bold text-emerald-800 text-sm">Pharmacy Payment Successful!</p>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-2 border-t border-emerald-100">
                  <div><span className="text-slate-400 font-medium">Payment ID:</span> #{paymentResult.paymentId}</div>
                  <div><span className="text-slate-400 font-medium">Amount:</span> ₹{paymentResult.amount}</div>
                  <div><span className="text-slate-400 font-medium">Mode:</span> {paymentResult.paymentMode}</div>
                  <div><span className="text-slate-400 font-medium">Status:</span> {paymentResult.paymentStatus}</div>
                  <div><span className="text-slate-400 font-medium">Type:</span> {paymentResult.paymentType || 'PHARMACY'}</div>
                  <div><span className="text-slate-400 font-medium">Txn ID:</span> {paymentResult.transactionId || '—'}</div>
                  <div className="col-span-2"><span className="text-slate-400 font-medium">Receipt #:</span> {paymentResult.receiptNumber || '—'}</div>
                  <div className="col-span-2"><span className="text-slate-400 font-medium">Date:</span> {formatDate(paymentResult.paymentDate)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── View Pharmacy Receipt Modal (GET /api/pharmacy/receipt/{prescriptionId}) ─── */}
      {receiptRxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Pharmacy Receipt for Rx #{receiptRxId}
              </h3>
              <button onClick={() => setReceiptRxId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingReceipt ? (
              <LoadingSpinner />
            ) : receiptData ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100">
                  {[
                    ['Receipt Number', receiptData.receiptNumber || '—'],
                    ['Transaction ID', receiptData.transactionId || '—'],
                    ['Amount', `₹${receiptData.amount}`],
                    ['Payment Mode', receiptData.paymentMode],
                    ['Payment Type', receiptData.paymentType || 'PHARMACY'],
                    ['Payment Status', receiptData.paymentStatus],
                    ['Payment Date', formatDate(receiptData.paymentDate)],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="flex justify-between py-2 first:pt-0 last:pb-0">
                      <span className="text-slate-500 font-medium">{lbl}</span>
                      <span className="font-bold text-slate-800">{val}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setReceiptRxId(null)}
                  className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2 text-xs"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
