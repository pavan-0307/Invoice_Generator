import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../services/currency';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { 
  ArrowLeft, 
  Printer, 
  CreditCard, 
  AlertCircle, 
  Calendar, 
  Plus, 
  Check, 
  X,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Briefcase
} from 'lucide-react';

const InvoiceDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentTouched, setPaymentTouched] = useState({});

  const validatePaymentData = (amount, reference) => {
    const errs = {};
    if (!amount) {
      errs.amount = 'Payment amount is required';
    } else {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        errs.amount = 'Please enter a valid payment amount greater than zero.';
      } else if (data && data.invoice) {
        const outstanding = calculateOutstandingBalance(data.invoice, data.payments);
        if (amt > outstanding + 0.01) {
          errs.amount = 'Payment amount cannot exceed outstanding balance';
        }
      }
    }
    
    if (reference && reference.length > 50) {
      errs.reference = 'Reference number cannot exceed 50 characters';
    }
    
    return errs;
  };

  useEffect(() => {
    setPaymentErrors(validatePaymentData(paymentAmount, referenceNumber));
  }, [paymentAmount, referenceNumber, data]);

  const handlePaymentBlur = (field) => {
    setPaymentTouched(prev => ({ ...prev, [field]: true }));
  };

  const getPaymentInputClass = (fieldName, baseClass) => {
    if (!paymentTouched[fieldName]) {
      return `${baseClass} focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500`;
    }
    if (paymentErrors[fieldName]) {
      return `${baseClass} border-rose-500 dark:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500`;
    }
    return `${baseClass} border-emerald-500 dark:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`;
  };

  // Payment Delete State
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/invoices/${id}`);
      if (response.data.success) {
        setData(response.data);
        // Default payment amount to outstanding balance
        const balance = calculateOutstandingBalance(response.data.invoice, response.data.payments);
        setPaymentAmount(balance.toFixed(2));
      } else {
        setError('Invoice not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const calculateOutstandingBalance = (invoice, paymentsList) => {
    const paymentsReceived = paymentsList.reduce((acc, p) => acc + parseFloat(p.amount), 0);
    return Math.max(parseFloat(invoice.grand_total) - paymentsReceived, 0);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');

    const validationErrs = validatePaymentData(paymentAmount, referenceNumber);
    if (Object.keys(validationErrs).length > 0) {
      setPaymentErrors(validationErrs);
      setPaymentTouched({ amount: true, reference: true });
      setPaymentError('Please fix the validation errors.');
      toast.error('Please fix the validation errors.');
      return;
    }

    const amt = parseFloat(paymentAmount);
    setPaymentSubmitting(true);
    try {
      const response = await api.post('/payments', {
        invoice_id: parseInt(id),
        amount: amt,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes: paymentNotes
      });

      if (response.data.success) {
        toast.success('Payment recorded successfully');
        setShowPaymentModal(false);
        // Clear modal details
        setReferenceNumber('');
        setPaymentNotes('');
        // Reload details
        fetchInvoiceDetails();
      } else {
        const msg = response.data.message || 'Failed to register payment.';
        setPaymentError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.message || 'Error occurred while saving payment details.';
      setPaymentError(msg);
      toast.error(msg);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Publishes draft invoice to Pending
  const handlePublishInvoice = async () => {
    try {
      const response = await api.put(`/invoices/${id}`, {
        invoice_date: data.invoice.invoice_date,
        due_date: data.invoice.due_date,
        tax_rate: parseFloat(data.invoice.tax_rate),
        items: data.items,
        status: 'Pending'
      });

      if (response.data.success) {
        toast.success('Invoice published successfully');
        fetchInvoiceDetails();
      } else {
        setError('Failed to publish invoice.');
        toast.error('Failed to publish invoice.');
      }
    } catch (err) {
      setError('Error while publishing invoice.');
      toast.error('Error while publishing invoice.');
    }
  };

  // Handles transaction deletion
  const handleDeletePayment = async (paymentId) => {
    try {
      setIsDeletingPayment(true);
      const response = await api.delete(`/payments/${paymentId}`);
      if (response.data.success) {
        toast.success('Payment record deleted successfully');
        setDeletingPaymentId(null);
        fetchInvoiceDetails();
      } else {
        toast.error(response.data.message || 'Failed to delete payment.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred while deleting payment.');
    } finally {
      setIsDeletingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-850 dark:text-white">Invoice Error</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{error}</p>
          <Link 
            to="/invoices" 
            className="mt-5 inline-block px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const { invoice, items, payments } = data;
  const outstandingBalance = calculateOutstandingBalance(invoice, payments);
  const paymentsReceived = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);

  const statusColors = {
    Paid: 'bg-emerald-500 text-emerald-800 dark:text-emerald-450 border-emerald-500/30',
    Pending: 'bg-indigo-500 text-indigo-800 dark:text-indigo-400 border-indigo-500/30',
    'Partially Paid': 'bg-amber-500 text-amber-800 dark:text-amber-400 border-amber-500/30',
    Overdue: 'bg-rose-500 text-rose-800 dark:text-rose-450 border-rose-500/30',
    Draft: 'bg-slate-400 text-slate-700 dark:text-slate-400 border-slate-400/30'
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Back button and page actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div className="flex items-center space-x-3">
          <Link 
            to="/invoices" 
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Invoice Details</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Invoice {invoice.invoice_number}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'Draft' && (
            <button
              onClick={handlePublishInvoice}
              className="flex items-center space-x-1.5 bg-indigo-650 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/10 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Publish Invoice</span>
            </button>
          )}

          {invoice.status !== 'Draft' && outstandingBalance > 0 && (
            <button
              onClick={() => { setPaymentTouched({}); setPaymentErrors({}); setShowPaymentModal(true); }}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
            >
              <span className="w-4 h-4 text-center font-bold">{getCurrencySymbol(user?.settings?.default_currency)}</span>
              <span>Record Payment</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-650 dark:text-slate-350 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Details layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Invoice Paper mockup */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm print-card space-y-8 relative overflow-hidden">
          {/* Custom Status Strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-500"></div>

          {/* Upper Branding and Invoice Meta */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              {invoice.logo_path ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL}/${invoice.logo_path}`} 
                  alt="Business Logo" 
                  className="h-12 w-auto max-h-16 object-contain mb-4 bg-white p-0.5 border border-slate-200/50 rounded-lg" 
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">INVOICE</span>
                </div>
              )}
              <h2 className="text-xl font-bold mt-2 text-slate-800 dark:text-slate-200">{invoice.invoice_number}</h2>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-opacity-10 dark:bg-opacity-20 ${statusColors[invoice.status]}`}>
                {invoice.status}
              </span>
            </div>
            
            <div className="text-left sm:text-right space-y-1 text-xs text-slate-500">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Invoice Issued Date</p>
              <p className="font-medium">{new Date(invoice.invoice_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300 pt-2">Payment Due Date</p>
              <p className={`font-semibold ${invoice.status === 'Overdue' ? 'text-rose-600' : 'text-slate-850 dark:text-slate-200'}`}>
                {new Date(invoice.due_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </p>
            </div>
          </div>

          {/* Client & Issuer metadata columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-850">
            {/* Issuer Profile info */}
            <div className="space-y-2 text-xs">
              <span className="block text-slate-400 font-bold uppercase tracking-wider">From</span>
              <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{invoice.business_name || 'My Business'}</p>
                <p className="flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{invoice.owner_name}</span>
                </p>
                {invoice.business_email && (
                  <p className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{invoice.business_email}</span>
                  </p>
                )}
                {invoice.business_phone && (
                  <p className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{invoice.business_phone}</span>
                  </p>
                )}
                {invoice.business_gst && (
                  <p className="flex items-center space-x-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-350">GSTIN: {invoice.business_gst}</span>
                  </p>
                )}
                {invoice.business_address && (
                  <p className="flex items-start space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <span className="whitespace-pre-line">
                      {invoice.business_address}{invoice.business_city ? `, ${invoice.business_city}` : ''}
                      {invoice.business_state ? `, ${invoice.business_state}` : ''}
                      {invoice.business_country ? `, ${invoice.business_country}` : ''}
                      {invoice.business_postal_code ? ` - ${invoice.business_postal_code}` : ''}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Client address metadata info */}
            <div className="space-y-2 text-xs">
              <span className="block text-slate-400 font-bold uppercase tracking-wider">Billed To</span>
              <div className="space-y-1 text-slate-600 dark:text-slate-400">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{invoice.client_name}</p>
                <p className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{invoice.client_email}</span>
                </p>
                {invoice.client_phone && (
                  <p className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{invoice.client_phone}</span>
                  </p>
                )}
                {invoice.client_address && (
                  <p className="flex items-start space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <span className="whitespace-pre-line">{invoice.client_address}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line items Table */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-850">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Line Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-450 uppercase text-[10px] font-bold border-b border-slate-200/50 dark:border-slate-800">
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-center">Quantity</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => (
                    <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                      <td className="px-4 py-3.5 font-medium">{item.description}</td>
                      <td className="px-4 py-3.5 text-center font-semibold">{parseFloat(item.quantity)}</td>
                      <td className="px-4 py-3.5 text-right font-medium">{formatCurrency(item.unit_price, user?.settings?.default_currency)}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.total, user?.settings?.default_currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Math Computations columns */}
          <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-850">
            <div className="w-full sm:w-80 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(invoice.subtotal, user?.settings?.default_currency)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Tax ({parseFloat(invoice.tax_rate)}%):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(invoice.tax_amount, user?.settings?.default_currency)}</span>
              </div>
              <div className="flex justify-between items-start text-slate-505">
                <span>Payments Received:</span>
                {paymentsReceived > 0 ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-450">{formatCurrency(paymentsReceived, user?.settings?.default_currency)}</span>
                ) : (
                  <span className="font-medium text-slate-400 dark:text-slate-500 italic">No payments have been received yet.</span>
                )}
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-2.5 text-base font-bold">
                <span className="text-slate-900 dark:text-white">Outstanding Balance:</span>
                <span className={outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-450'}>
                  {formatCurrency(outstandingBalance, user?.settings?.default_currency)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side Info sidebar: Payment history */}
        <div className="space-y-6 no-print">
          
          {/* Summary Balance Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Billing Summary</h3>
            
            <div className="space-y-3.5 text-sm">
              {/* Invoice Total */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Invoice Total</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-250">
                  {formatCurrency(invoice.grand_total, user?.settings?.default_currency)}
                </span>
              </div>
              
              {/* Payments Received */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-455" />
                  <span>Payments Received</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-450">
                  {formatCurrency(paymentsReceived, user?.settings?.default_currency)}
                </span>
              </div>
              
              {/* Outstanding Balance */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  {outstandingBalance > 0 ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-450" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
                  )}
                  <span>Outstanding Balance</span>
                </span>
                <span className={`font-bold ${outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-450'}`}>
                  {formatCurrency(outstandingBalance, user?.settings?.default_currency)}
                </span>
              </div>
            </div>

            {invoice.status !== 'Draft' && outstandingBalance > 0 && (
              <button
                onClick={() => { setPaymentTouched({}); setPaymentErrors({}); setShowPaymentModal(true); }}
                className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record a Payment</span>
              </button>
            )}
          </div>

          {/* Payment History panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-850 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Payment History</h3>
            <div className="space-y-3">
              {payments.length > 0 ? (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider">
                        <th className="py-2 pr-2">Date</th>
                        <th className="py-2 px-2">Method & Ref</th>
                        <th className="py-2 pl-2 text-right">Amount</th>
                        <th className="py-2 pl-2 text-right no-print"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 pr-2 font-medium text-slate-600 dark:text-slate-455">
                            {new Date(p.payment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-2 text-slate-550 dark:text-slate-400">
                            <div className="font-medium text-slate-700 dark:text-slate-300">{p.payment_method}</div>
                            {p.reference_number && <div className="text-[10px] text-slate-400">Ref: {p.reference_number}</div>}
                          </td>
                          <td className="py-2.5 pl-2 text-right font-bold text-emerald-600 dark:text-emerald-450">
                            {formatCurrency(p.amount, user?.settings?.default_currency)}
                          </td>
                          <td className="py-2.5 pl-2 text-right no-print">
                            <button
                              onClick={() => setDeletingPaymentId(p.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors"
                              title="Delete Payment Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-450 text-xs">
                  <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-800 mx-auto mb-2" />
                  <span>No payment records available.</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Record Payment Dialog Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh] md:max-h-[85vh]">
            
            {/* Header - Fixed */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-850 dark:text-white">Record Invoice Payment</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-650 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form wrapping body + footer */}
            <form onSubmit={handleRecordPayment} className="flex flex-col flex-1 overflow-hidden">
              
              {/* Body - Scrollable */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {paymentError && (
                  <div className="bg-rose-50 dark:bg-rose-955/20 border-l-4 border-rose-500 p-3.5 rounded-r-lg flex items-start space-x-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <span className="text-xs text-rose-800 dark:text-rose-350">{paymentError}</span>
                  </div>
                )}

                {/* Summary breakdown of Invoice Total, Payments Received, and Outstanding Balance */}
                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-150/60 dark:border-slate-800/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-505">
                    <span>Invoice Total:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(invoice.grand_total, user?.settings?.default_currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-505">
                    <span>Payments Received:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-455">
                      {formatCurrency(paymentsReceived, user?.settings?.default_currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-bold border-t border-slate-200 dark:border-slate-800 pt-2 text-sm text-rose-605">
                    <span>Outstanding Balance:</span>
                    <span className={outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-650 dark:text-emerald-400'}>
                      {formatCurrency(outstandingBalance, user?.settings?.default_currency)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-405 uppercase tracking-wider mb-1.5">Amount *</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-slate-400 sm:text-sm font-semibold">{getCurrencySymbol(user?.settings?.default_currency)}</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      onBlur={() => handlePaymentBlur('amount')}
                      className={getPaymentInputClass('amount', "block w-full pl-7 pr-3 py-2.5 bg-slate-50 dark:bg-slate-805 border border-slate-205 dark:border-slate-750 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none sm:text-sm font-semibold")}
                    />
                  </div>
                  {paymentTouched.amount && paymentErrors.amount && (
                    <p className="mt-1 text-xs text-rose-500">{paymentErrors.amount}</p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400 font-medium">Remaining outstanding balance: {formatCurrency(outstandingBalance, user?.settings?.default_currency)}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-750 rounded-xl text-slate-900 dark:text-white placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-405 uppercase tracking-wider mb-1.5">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="block w-full py-2.5 px-3 border border-slate-205 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-808 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Stripe">Stripe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Reference Number</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    onBlur={() => handlePaymentBlur('reference')}
                    className={getPaymentInputClass('reference', "block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-750 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none sm:text-sm")}
                    placeholder="e.g. TXN-10293847"
                  />
                  {paymentTouched.reference && paymentErrors.reference && (
                    <p className="mt-1 text-xs text-rose-500">{paymentErrors.reference}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    rows="2"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-750 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm"
                    placeholder="Optional memo..."
                  />
                </div>

              </div>

              {/* Footer - Sticky */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 shrink-0 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentSubmitting}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-750 text-slate-505 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(paymentErrors).length > 0 || paymentSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {paymentSubmitting ? 'Recording Payment...' : 'Record Payment'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingPaymentId}
        onClose={() => setDeletingPaymentId(null)}
        onConfirm={() => handleDeletePayment(deletingPaymentId)}
        title="Delete Payment Record?"
        message="Are you sure you want to delete this payment log? The action cannot be undone, and the invoice outstanding balance and status will be updated automatically."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeletingPayment}
        loadingText="Deleting..."
      />
    </div>
  );
};

export default InvoiceDetails;
