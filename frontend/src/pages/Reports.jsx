import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../services/currency';
import { BarChart3, Download, Printer, FileSpreadsheet, TrendingUp, AlertCircle, FileText } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchReportData(); }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [invRes, dashRes] = await Promise.all([api.get('/invoices'), api.get('/dashboard')]);
      if (invRes.data.success && dashRes.data.success) {
        setInvoices(invRes.data.invoices);
        setDashboardData(dashRes.data);
      } else { setError('Failed to fetch reporting data.'); }
    } catch (err) { setError('Connection failed. Please ensure the API is running.'); }
    finally { setLoading(false); }
  };

  const invoiceReport = invoices.reduce((acc, inv) => {
    const status = inv.status;
    const total = parseFloat(inv.grand_total) || 0;
    if (!acc[status]) acc[status] = { count: 0, total: 0 };
    acc[status].count += 1;
    acc[status].total += total;
    return acc;
  }, { Paid: { count: 0, total: 0 }, Pending: { count: 0, total: 0 }, 'Partially Paid': { count: 0, total: 0 }, Overdue: { count: 0, total: 0 }, Draft: { count: 0, total: 0 } });

  const exportToCSV = () => {
    if (invoices.length === 0) return;
    const headers = ['Invoice Number', 'Client Name', 'Invoice Date', 'Due Date', 'Status', 'Grand Total'];
    const rows = invoices.map(inv => [
      inv.invoice_number, `"${inv.client_name.replace(/"/g, '""')}"`,
      inv.invoice_date, inv.due_date, inv.status, parseFloat(inv.grand_total).toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoice_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => window.print();

  const statusDot = { Paid: 'bg-emerald-500', Pending: 'bg-indigo-500', 'Partially Paid': 'bg-amber-500', Overdue: 'bg-rose-500', Draft: 'bg-slate-400' };

  if (loading) return (
    <div className="p-6 space-y-5 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );

  if (error || !dashboardData) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="card-padded text-center max-w-sm w-full">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Reporting Error</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{error}</p>
        <button onClick={fetchReportData} className="btn-primary mt-4 mx-auto">Retry</button>
      </div>
    </div>
  );

  const { metrics, trends } = dashboardData;
  const curr = user?.settings?.default_currency;

  return (
    <div className="p-6 space-y-5 animate-fade-in print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Review revenue summaries and download financial logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportToCSV} disabled={invoices.length === 0} className="btn-secondary text-xs gap-1.5 disabled:opacity-50">
            <FileSpreadsheet className="w-4 h-4 text-brand-500" /> Export CSV
          </button>
          <button onClick={handlePrint} className="btn-primary text-xs gap-1.5">
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Gross Revenue', value: formatCurrency(metrics.total_revenue, curr), color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950/20', note: 'Sum of all collected payments' },
          { label: 'Pending Receivables', value: formatCurrency(metrics.pending_amount, curr), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20', note: 'Outstanding invoices' },
          { label: 'Overdue Receivables', value: formatCurrency(metrics.overdue_amount, curr), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20', note: 'Critical attention required' },
        ].map((card, i) => (
          <div key={i} className="card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
              <p className="text-xs text-slate-400 mt-1">{card.note}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center text-xl font-bold text-slate-500`}>
              {getCurrencySymbol(curr)}
            </div>
          </div>
        ))}
      </div>

      {/* Report Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:grid-cols-1">
        {/* Revenue Report */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-brand-500" /> Revenue Report
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <th className="tbl-head">Billing Period</th>
                  <th className="tbl-head text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((t, i) => (
                  <tr key={i} className="tbl-row">
                    <td className="tbl-cell">{t.name}</td>
                    <td className="tbl-cell text-right font-bold text-slate-900 dark:text-white">{formatCurrency(t.revenue, curr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Status Report */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-brand-500" /> Invoice Status Report
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <th className="tbl-head">Status</th>
                  <th className="tbl-head text-center">Count</th>
                  <th className="tbl-head text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(invoiceReport).map(([status, item]) => (
                  <tr key={status} className="tbl-row">
                    <td className="tbl-cell">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusDot[status] || 'bg-slate-400'}`} />
                        {status}
                      </div>
                    </td>
                    <td className="tbl-cell text-center font-medium">{item.count}</td>
                    <td className="tbl-cell text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.total, curr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
