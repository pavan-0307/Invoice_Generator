import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../services/currency';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { Plus, Search, Eye, Trash2, AlertCircle, FileText, Filter, Calendar } from 'lucide-react';

const STATUS_FILTERS = ['All', 'Draft', 'Pending', 'Partially Paid', 'Paid', 'Overdue'];

const statusBadge = {
  Paid: 'badge-paid',
  Pending: 'badge-pending',
  'Partially Paid': 'badge-partial',
  Overdue: 'badge-overdue',
  Draft: 'badge-draft',
};

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchInvoices(); }, [search, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/invoices?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`);
      if (response.data.success) { setInvoices(response.data.invoices); }
      else { setError('Failed to fetch invoices.'); }
    } catch (err) { setError('Connection failed. Please ensure the backend server is running.'); }
    finally { setLoading(false); }
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
        setError(msg); toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error occurred while deleting invoice.';
      setError(msg); toast.error(msg);
    } finally { setIsDeleting(false); }
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage billing, payments, and receivables.</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Create Invoice
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by invoice number or client name..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-10" />
          </div>
          <div className="md:w-44 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input">
              {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Invoices' : s}</option>)}
            </select>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-brand-500 text-white shadow-brand'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading && invoices.length === 0 ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <th className="tbl-head">Invoice #</th>
                  <th className="tbl-head">Client</th>
                  <th className="tbl-head">Invoice Date</th>
                  <th className="tbl-head">Due Date</th>
                  <th className="tbl-head">Status</th>
                  <th className="tbl-head">Grand Total</th>
                  <th className="tbl-head text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? invoices.map(inv => (
                  <tr key={inv.id} className="tbl-row">
                    <td className="tbl-cell font-bold text-slate-900 dark:text-white">
                      <Link to={`/invoices/${inv.id}`} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="tbl-cell font-medium">{inv.client_name}</td>
                    <td className="tbl-cell">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />{new Date(inv.invoice_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="tbl-cell">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />{new Date(inv.due_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="tbl-cell">
                      <span className={statusBadge[inv.status] || 'badge-draft'}>{inv.status}</span>
                    </td>
                    <td className="tbl-cell font-bold text-slate-900 dark:text-white text-base">
                      {formatCurrency(inv.grand_total, user?.settings?.default_currency)}
                    </td>
                    <td className="tbl-cell text-right no-print">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/invoices/${inv.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                          title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setDeletingId(inv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <FileText className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No invoices found</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Create a new invoice to start billing.</p>
                      <Link to="/invoices/new" className="btn-primary mx-auto text-xs px-4 py-2">
                        <Plus className="w-3.5 h-3.5" /> Create Invoice
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
