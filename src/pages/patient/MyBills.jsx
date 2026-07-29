/**
 * Patient MyBills Page
 * Displays authentic payment receipts returned by backend APIs for Consultation, Laboratory, and Pharmacy.
 *
 * Strictly adheres to backend security & business flow:
 *   - Patients CANNOT initiate payments from this page (Payment collection is restricted to Receptionist/Lab/Pharmacy staff).
 *   - Receipts are displayed ONLY AFTER backend returns success.
 *   - If receipt does not exist (HTTP 404), displays "Payment Pending" without showing fake receipt data.
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Receipt,
  Search,
  CheckCircle,
  AlertCircle,
  Printer,
  X,
  FlaskConical,
  Pill,
  Stethoscope,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import appointmentApi from '../../api/appointmentApi';
import labOrderApi from '../../api/labOrderApi';
import billingApi from '../../api/billingApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PAYMENT_MODE_LABELS = {
  CASH: '💵 Cash',
  CARD: '💳 Card',
  UPI: '📱 UPI',
  NET_BANKING: '🏦 Net Banking',
};

export default function MyBills() {
  const { user } = useAuth();
  const patientId = user?.userId || user?.id;

  const [activeTab, setActiveTab] = useState('CONSULTATION'); // 'CONSULTATION' | 'LABORATORY' | 'PHARMACY'
  const [appointments, setAppointments] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Selected item ID
  const [selectedId, setSelectedId] = useState('');

  // Receipt State
  const [receipt, setReceipt] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [fetchingReceipt, setFetchingReceipt] = useState(false);

  // Printable Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  /** Load patient appointments & lab orders on mount */
  useEffect(() => {
    if (!patientId) return;
    const loadPatientData = async () => {
      setLoadingList(true);
      try {
        const [apptRes, labRes] = await Promise.allSettled([
          appointmentApi.getByPatient(patientId),
          labOrderApi.getByPatient(patientId),
        ]);

        if (apptRes.status === 'fulfilled') {
          setAppointments(apptRes.value.data || []);
        }
        if (labRes.status === 'fulfilled') {
          setLabOrders(labRes.value.data || []);
        }
      } catch (err) {
        console.error('Failed to load patient records:', err);
      } finally {
        setLoadingList(false);
      }
    };
    loadPatientData();
  }, [patientId]);

  /** Reset selection when tab changes */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedId('');
    setReceipt(null);
    setIsPending(false);
  };

  /** Fetch official backend receipt for selected ID */
  const fetchReceipt = useCallback(async (idToFetch, category) => {
    const numericId = Number(idToFetch);
    if (!numericId) {
      toast.error('Please select or enter a valid ID');
      return;
    }

    setFetchingReceipt(true);
    setReceipt(null);
    setIsPending(false);

    try {
      let res;
      if (category === 'CONSULTATION') {
        res = await billingApi.consultationReceipt(numericId);
      } else if (category === 'LABORATORY') {
        res = await billingApi.labReceipt(numericId);
      } else if (category === 'PHARMACY') {
        res = await billingApi.pharmacyReceipt(numericId);
      }

      if (res?.data) {
        setReceipt(res.data);
        setIsPending(false);
        toast.success('Official payment receipt loaded.');
      } else {
        setIsPending(true);
      }
    } catch (err) {
      console.log('Receipt API Response error:', err);
      if (err.response?.status === 404 || err.response?.status === 400) {
        setIsPending(true);
        setReceipt(null);
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch receipt');
      }
    } finally {
      setFetchingReceipt(false);
    }
  }, []);

  /** Handle item selection from dropdown */
  const handleSelectChange = (e) => {
    const val = e.target.value;
    setSelectedId(val);
    if (val) {
      fetchReceipt(val, activeTab);
    } else {
      setReceipt(null);
      setIsPending(false);
    }
  };

  /** Handle manual search submit */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (selectedId) {
      fetchReceipt(selectedId, activeTab);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loadingList) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Medical Receipts & Bills</h1>
        <p className="text-sm text-slate-500">
          View official payment receipts issued by hospital departments
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange('CONSULTATION')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-all shrink-0 cursor-pointer ${
            activeTab === 'CONSULTATION'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          Consultation Receipts
        </button>
        <button
          onClick={() => handleTabChange('LABORATORY')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-all shrink-0 cursor-pointer ${
            activeTab === 'LABORATORY'
              ? 'border-purple-600 text-purple-600 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FlaskConical className="h-4 w-4" />
          Laboratory Receipts
        </button>
        <button
          onClick={() => handleTabChange('PHARMACY')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-all shrink-0 cursor-pointer ${
            activeTab === 'PHARMACY'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Pill className="h-4 w-4" />
          Pharmacy Receipts
        </button>
      </div>

      {/* Search / Dropdown Selector Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Select {activeTab === 'CONSULTATION' ? 'Appointment' : activeTab === 'LABORATORY' ? 'Lab Order' : 'Prescription'} ID
        </h3>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            {activeTab === 'CONSULTATION' ? (
              <select
                value={selectedId}
                onChange={handleSelectChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Select Appointment Slot --</option>
                {appointments.map((app) => (
                  <option key={app.id || app.appointmentId} value={app.id || app.appointmentId}>
                    Appointment #{app.id || app.appointmentId} | Dr. {app.doctorName || 'Doctor'} ({app.status})
                  </option>
                ))}
              </select>
            ) : activeTab === 'LABORATORY' ? (
              <select
                value={selectedId}
                onChange={handleSelectChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-purple-500 focus:outline-none"
              >
                <option value="">-- Select Lab Order --</option>
                {labOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Lab Order #{order.id} | Test: {order.labTestName || 'Diagnostic Test'} ({order.status})
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  placeholder="Enter Prescription ID"
                  className="w-full pl-10 rounded-xl border border-slate-200 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  min="1"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={fetchingReceipt || !selectedId}
            className={`rounded-xl text-white font-semibold px-5 py-2.5 transition-colors disabled:opacity-50 text-sm cursor-pointer ${
              activeTab === 'CONSULTATION'
                ? 'bg-blue-600 hover:bg-blue-700'
                : activeTab === 'LABORATORY'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {fetchingReceipt ? 'Loading Receipt...' : 'Fetch Receipt'}
          </button>
        </form>
      </div>

      {/* Results Area */}
      {fetchingReceipt ? (
        <LoadingSpinner />
      ) : receipt ? (
        /* Authentic Receipt Details Card */
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Receipt #{receipt.receiptNumber}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Official {activeTab} Payment Receipt
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              View Printable Receipt
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Receipt Number</p>
              <p className="font-bold text-slate-800 mt-0.5">{receipt.receiptNumber}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Transaction ID</p>
              <p className="font-mono text-xs font-bold text-slate-800 mt-0.5">{receipt.transactionId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Amount Paid</p>
              <p className="font-bold text-emerald-700 text-lg mt-0.5">
                ₹{receipt.amount != null ? Number(receipt.amount).toLocaleString('en-IN') : '0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Payment Mode</p>
              <p className="font-bold text-slate-800 mt-0.5">{PAYMENT_MODE_LABELS[receipt.paymentMode] || receipt.paymentMode}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Payment Type</p>
              <p className="font-bold text-slate-800 mt-0.5">{receipt.paymentType}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Payment Status</p>
              <p className="font-bold text-emerald-700 mt-0.5">{receipt.paymentStatus}</p>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-slate-400 font-semibold uppercase">Payment Date & Time</p>
              <p className="font-bold text-slate-800 mt-0.5">{formatDate(receipt.paymentDate)}</p>
            </div>
          </div>

          {/* Backend Support Required Warning regarding PDF download */}
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <Info className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>Backend Support Required:</strong> PDF invoice download API is not available on the backend. Use the print feature for physical paper copies.
            </span>
          </div>
        </div>
      ) : isPending ? (
        /* Payment Pending Card — No fake receipts generated */
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm space-y-4 animate-fade-in text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-amber-900">Payment Pending / Unpaid</h4>
              <p className="text-xs text-amber-700">No official receipt has been issued for this record yet.</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-amber-200/80 space-y-2">
            <p className="font-semibold text-slate-800">
              Notice regarding payment collection:
            </p>
            <p>
              Payments cannot be initiated directly from the Patient Dashboard. Please complete payment at the respective hospital desk:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-500 font-medium pl-1">
              <li><strong>Consultation Payment:</strong> Collected by Receptionist at Reception Desk</li>
              <li><strong>Laboratory Payment:</strong> Collected by Lab Technician at Diagnostic Lab Counter</li>
              <li><strong>Pharmacy Payment:</strong> Collected by Pharmacist at Hospital Pharmacy Counter</li>
            </ul>
            <p className="text-amber-800 font-bold pt-1">
              Once payment is completed, your receipt will automatically appear here.
            </p>
          </div>
        </div>
      ) : null}

      {/* Printable Receipt Modal */}
      {showReceiptModal && receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6 animate-fade-in relative my-auto">
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Official Payment Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="rounded-full p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-2xl border border-slate-200 bg-white text-left text-xs">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg font-extrabold text-blue-600">HOSPITAL MANAGEMENT SYSTEM</h2>
                <p className="text-[11px] text-slate-500">Official Payment Receipt</p>
              </div>

              <div className="space-y-2 font-medium divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-bold text-slate-800">{receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-800">{receipt.transactionId}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Payment Type:</span>
                  <span className="font-bold text-slate-800">{receipt.paymentType}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-800">{receipt.paymentMode}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700">{receipt.paymentStatus}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-800">{formatDate(receipt.paymentDate)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-extrabold text-slate-900 border-t border-slate-200">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-700">₹{receipt.amount}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                This is a verified computer-generated receipt.
              </div>
            </div>

            <button
              onClick={() => setShowReceiptModal(false)}
              className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 transition-colors print:hidden cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
