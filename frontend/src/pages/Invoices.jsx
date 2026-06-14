import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../services/currency';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  AlertCircle,
  FileText,
  Filter,
  Calendar
} from 'lucide-react';

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/invoices?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`);
      if (response.data.success) {
        setInvoices(response.data.invoices);
      } else {
        setError('Failed to fetch invoices.');
      }
    } catch (err) {
      setError('Connection failed. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (id) => {
    try {
      setIsDeleting(true);
      const response = await api.delete(`/invoices/${id}`);
      if (response.data.success) {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        toast.success('Invoice deleted successfully');
        setDeletingId(null);
      } else {
        const msg = response.data.message || 'Failed to delete invoice.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error occurred while deleting invoice.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const statusColors = {
    Paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
    Pending: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30',
    'Partially Paid': 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
    Overdue: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border-rose-200 dark:border-rose-900/30',
    Draft: 'bg-slate-100 text-slate-650 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-850'
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[status] || 'bg-slate-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage billing, draft payments, and track receivables.</p>
        </div>
        <Link
          to="/invoices/new"
          className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand-500/10 transition-all cursor-pointer animate-fade-in"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </Link>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-4 rounded-r-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span className="text-sm text-rose-800 dark:text-rose-350">{error}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search Field */}
          <div className="w-full md:flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-450" />
            </div>
            <input
              type="text"
              placeholder="Search by invoice number or client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="w-full md:w-48 relative flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full py-2 px-3 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm"
            >
              <option value="All">All Invoices</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {['All', 'Draft', 'Pending', 'Partially Paid', 'Paid', 'Overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer
                ${statusFilter === status 
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/10' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}
              `}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table layout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        {loading && invoices.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/10 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-150 dark:border-slate-800">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Invoice Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Grand Total</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4.5 font-bold text-slate-900 dark:text-white">
                        <Link to={`/invoices/${inv.id}`} className="hover:text-brand-600 transition-colors">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4.5 text-slate-700 dark:text-slate-300 font-medium">{inv.client_name}</td>
                      <td className="px-6 py-4.5 text-slate-500 dark:text-slate-450 text-xs">
                        <span className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(inv.invoice_date).toLocaleDateString()}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-slate-500 dark:text-slate-450 text-xs">
                        <span className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(inv.due_date).toLocaleDateString()}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4.5">{getStatusBadge(inv.status)}</td>
                      <td className="px-6 py-4.5 font-bold text-slate-905 dark:text-white text-base">
                        {formatCurrency(inv.grand_total, user?.settings?.default_currency)}
                      </td>
                      <td className="px-6 py-4.5 text-right no-print">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link 
                            to={`/invoices/${inv.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </Link>
                          <button 
                            onClick={() => setDeletingId(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center text-slate-450">
                      <FileText className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                      <h3 className="font-semibold text-slate-700 dark:text-slate-300">No invoices created yet.</h3>
                      <p className="text-xs text-slate-400 mt-1">Create a new invoice to start billing.</p>
                      <Link 
                        to="/invoices/new" 
                        className="mt-4 inline-flex items-center space-x-1 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Invoice</span>
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => handleDeleteInvoice(deletingId)}
        title="Delete Invoice?"
        message="Are you sure you want to delete this invoice? The action cannot be undone. All payment details for this invoice will be deleted."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </div>
  );
};

export default Invoices;
