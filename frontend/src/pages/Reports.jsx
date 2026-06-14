import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../services/currency';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  FileSpreadsheet, 
  TrendingUp, 
  AlertCircle,
  FileText
} from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [invRes, dashRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/dashboard')
      ]);

      if (invRes.data.success && dashRes.data.success) {
        setInvoices(invRes.data.invoices);
        setDashboardData(dashRes.data);
      } else {
        setError('Failed to fetch reporting data.');
      }
    } catch (err) {
      setError('Connection failed. Please ensure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Group Invoices by Status
  const invoiceReport = invoices.reduce((acc, inv) => {
    const status = inv.status;
    const total = parseFloat(inv.grand_total) || 0;
    
    if (!acc[status]) {
      acc[status] = { count: 0, total: 0 };
    }
    acc[status].count += 1;
    acc[status].total += total;
    
    return acc;
  }, {
    Paid: { count: 0, total: 0 },
    Pending: { count: 0, total: 0 },
    'Partially Paid': { count: 0, total: 0 },
    Overdue: { count: 0, total: 0 },
    Draft: { count: 0, total: 0 }
  });

  // 2. Fetch payments from dashboard or compute groupings
  // Since we don't have all payments list, but we have dashboard trends, let's use dashboard trends for Monthly Revenue.
  // And let's calculate Daily/Yearly from invoice payment dates if available, or summarize dashboard trends.
  // Wait, let's write a generic CSV builder for Invoices:
  const exportToCSV = () => {
    if (invoices.length === 0) return;

    // Headers
    const headers = ['Invoice Number', 'Client Name', 'Invoice Date', 'Due Date', 'Status', 'Grand Total'];
    
    // Rows
    const rows = invoices.map(inv => [
      inv.invoice_number,
      `"${inv.client_name.replace(/"/g, '""')}"`,
      inv.invoice_date,
      inv.due_date,
      inv.status,
      parseFloat(inv.grand_total).toFixed(2)
    ]);

    // Build content
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Trigger download
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-850 dark:text-white">Reporting Error</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{error}</p>
          <button 
            onClick={fetchReportData}
            className="mt-5 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { metrics, trends } = dashboardData;

  return (
    <div className="p-6 space-y-6 animate-fade-in print:p-0">
      
      {/* Page Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Financial Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review revenue summaries and download financial logs.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            disabled={invoices.length === 0}
            className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-350 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export to CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-brand-500/10 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Overview stats layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total revenue log widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Gross Revenue</span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-450">{formatCurrency(metrics.total_revenue, user?.settings?.default_currency)}</h3>
            <p className="text-[10px] text-slate-400">Sum of all transaction logs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-650 text-xl font-bold font-display">
            {getCurrencySymbol(user?.settings?.default_currency)}
          </div>
        </div>

        {/* Outstanding stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Pending Receivables</span>
            <h3 className="text-2xl font-black text-indigo-650 dark:text-indigo-400">{formatCurrency(metrics.pending_amount, user?.settings?.default_currency)}</h3>
            <p className="text-[10px] text-slate-400">Sum of outstanding invoices</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-650 text-xl font-bold font-display">
            {getCurrencySymbol(user?.settings?.default_currency)}
          </div>
        </div>

        {/* Overdue receivables stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Overdue Receivables</span>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-455">{formatCurrency(metrics.overdue_amount, user?.settings?.default_currency)}</h3>
            <p className="text-[10px] text-rose-400 text-rose-500 font-medium">Critical attention required</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-955/20 flex items-center justify-center text-rose-650 text-xl font-bold font-display">
            {getCurrencySymbol(user?.settings?.default_currency)}
          </div>
        </div>
      </div>

      {/* Main Reports breakdown grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
        
        {/* Revenue Reports: Daily/Monthly/Yearly */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-850 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            <span>Revenue Report</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-xs text-slate-400 font-semibold border-b border-slate-150 dark:border-slate-800">
                  <th className="px-4 py-2.5">Billing Period</th>
                  <th className="px-4 py-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Monthly list */}
                {trends.map((t, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-350">{t.name}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(t.revenue, user?.settings?.default_currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Summary Report counts and sums */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-850 dark:text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <span>Invoice Status Report</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-xs text-slate-400 font-semibold border-b border-slate-150 dark:border-slate-800">
                  <th className="px-4 py-2.5">Invoice Status</th>
                  <th className="px-4 py-2.5 text-center">Invoices Count</th>
                  <th className="px-4 py-2.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.entries(invoiceReport).map(([status, item]) => (
                  <tr key={status}>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-350">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
                        status === 'Paid' ? 'bg-emerald-500' :
                        status === 'Pending' ? 'bg-indigo-500' :
                        status === 'Partially Paid' ? 'bg-amber-500' :
                        status === 'Overdue' ? 'bg-rose-500' : 'bg-slate-400'
                      }`}></span>
                      {status}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-medium">{item.count}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.total, user?.settings?.default_currency)}</td>
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
