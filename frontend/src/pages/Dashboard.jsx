import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../services/currency';
import {
  Clock, AlertTriangle, Users, FileText, Plus, TrendingUp,
  Calendar, ChevronRight, ArrowUpRight, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      if (response.data.success) { setData(response.data); }
      else { setError('Failed to load dashboard data.'); toast.error('Failed to load dashboard data.'); }
    } catch (err) {
      setError('Connection error. Please ensure the API backend is running.');
      toast.error('Network Connection Error');
    } finally { setLoading(false); }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/dashboard');
      if (response.data.success) { setData(response.data); toast.success('Data Refreshed Successfully'); }
      else { toast.error('Failed to load dashboard data.'); }
    } catch (err) { toast.error('Network Connection Error'); }
    finally { setRefreshing(false); }
  };

  if (loading) return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="card-padded text-center max-w-sm w-full">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Dashboard Error</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary mt-4 mx-auto">Retry</button>
      </div>
    </div>
  );

  const { metrics, trends, distribution, recent_invoices, recent_payments } = data;

  const logoUrl = user?.settings?.logo_path ? `${import.meta.env.VITE_API_URL}/${user.settings.logo_path}` : null;
  const businessName = user?.settings?.business_name || user?.business_name || 'Dashboard';
  const ownerName = user?.settings?.owner_name || user?.owner_name || 'Business Owner';

  if (metrics.total_invoices === 0 && metrics.total_clients === 0) return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader businessName={businessName} ownerName={ownerName} logoUrl={logoUrl}
        refreshing={refreshing} handleRefresh={handleRefresh} />
      <div className="card p-12 text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <FileText className="w-7 h-7 text-slate-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No business activity yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">Create clients and invoices to start tracking revenue and billing.</p>
        </div>
        <div className="flex gap-3 pt-1">
          <Link to="/clients" className="btn-secondary">Add Client</Link>
          <Link to="/invoices/new" className="btn-primary">Create Invoice</Link>
        </div>
      </div>
    </div>
  );

  const totalInvoicesDist = Object.values(distribution).reduce((a, b) => a + b, 0);
  const maxRevenue = Math.max(...trends.map(t => t.revenue), 1000);
  const chartH = 160; const chartW = 500; const pad = 30;
  const gW = chartW - pad * 2; const gH = chartH - pad * 2;

  const points = trends.map((t, i) => {
    const x = pad + (i / Math.max(trends.length - 1, 1)) * gW;
    const y = chartH - pad - (t.revenue / maxRevenue) * gH;
    return `${x},${y}`;
  });
  const linePath = points.join(' ');
  const areaPath = points.length
    ? `${points[0].split(',')[0]},${chartH - pad} ` + linePath + ` ${points[points.length - 1].split(',')[0]},${chartH - pad}`
    : '';

  const statusDot = { Paid: 'bg-emerald-500', Pending: 'bg-indigo-500', 'Partially Paid': 'bg-amber-500', Overdue: 'bg-rose-500', Draft: 'bg-slate-400' };
  const statusBadgeCls = {
    Paid: 'badge-paid', Pending: 'badge-pending', 'Partially Paid': 'badge-partial',
    Overdue: 'badge-overdue', Draft: 'badge-draft'
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader businessName={businessName} ownerName={ownerName} logoUrl={logoUrl}
        refreshing={refreshing} handleRefresh={handleRefresh} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(metrics.total_revenue, user?.settings?.default_currency), color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950/20', icon: getCurrencySymbol(user?.settings?.default_currency) },
          { label: 'Pending', value: formatCurrency(metrics.pending_amount, user?.settings?.default_currency), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: getCurrencySymbol(user?.settings?.default_currency) },
          { label: 'Overdue', value: formatCurrency(metrics.overdue_amount, user?.settings?.default_currency), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20', icon: getCurrencySymbol(user?.settings?.default_currency) },
          { label: 'Clients', value: metrics.total_clients, color: 'text-slate-800 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-800', iconComp: <Users className="w-5 h-5 text-slate-500" /> },
          { label: 'Invoices', value: metrics.total_invoices, color: 'text-slate-800 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-800', iconComp: <FileText className="w-5 h-5 text-slate-500" /> },
        ].map((card, i) => (
          <div key={i} className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
              {card.iconComp || <span className="text-sm font-bold text-slate-500">{card.icon}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Monthly Revenue Trend</h3>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Last 6 months
            </span>
          </div>
          <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1={pad} y1={pad} x2={chartW - pad} y2={pad} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={pad} y1={pad + gH / 2} x2={chartW - pad} y2={pad + gH / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={pad} y1={chartH - pad} x2={chartW - pad} y2={chartH - pad} stroke="#cbd5e1" />
              {areaPath && <path d={areaPath} fill="url(#chartGrad)" />}
              {linePath && <path d={`M ${linePath}`} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
              {trends.map((t, i) => {
                const x = pad + (i / Math.max(trends.length - 1, 1)) * gW;
                const y = chartH - pad - (t.revenue / maxRevenue) * gH;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4.5" fill="#fff" stroke="#10b981" strokeWidth="2.5" />
                    <text x={x} y={chartH - 8} textAnchor="middle" fontSize="9" className="fill-slate-400">{t.name.split(' ')[0]}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">Invoice Distribution</h3>
          <div className="space-y-3.5">
            {Object.entries(distribution).map(([status, count]) => {
              const pct = totalInvoicesDist > 0 ? (count / totalInvoicesDist) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between items-center text-xs font-medium mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusDot[status] || 'bg-slate-400'}`} />
                      <span className="text-slate-600 dark:text-slate-400">{status}</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusDot[status] || 'bg-slate-400'}`} style={{ width: `${pct}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-400">
            <span>Total invoices</span>
            <span className="font-bold text-slate-600 dark:text-slate-300">{totalInvoicesDist}</span>
          </div>
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Invoices */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Recent Invoices</h3>
            <Link to="/invoices" className="text-xs text-brand-600 dark:text-brand-400 font-semibold flex items-center hover:underline">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <th className="tbl-head">Invoice #</th>
                <th className="tbl-head">Client</th>
                <th className="tbl-head">Total</th>
                <th className="tbl-head text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent_invoices.length > 0 ? recent_invoices.map(inv => (
                <tr key={inv.id} className="tbl-row">
                  <td className="tbl-cell font-semibold">
                    <Link to={`/invoices/${inv.id}`} className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400">
                      {inv.invoice_number} <ArrowUpRight className="w-3 h-3 text-slate-400" />
                    </Link>
                  </td>
                  <td className="tbl-cell text-slate-500 truncate max-w-[100px]">{inv.client_name}</td>
                  <td className="tbl-cell font-bold text-slate-900 dark:text-white">{formatCurrency(inv.grand_total, user?.settings?.default_currency)}</td>
                  <td className="tbl-cell text-right">
                    <span className={statusBadgeCls[inv.status] || 'badge-draft'}>{inv.status}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="tbl-cell text-center text-slate-400 py-8">No invoices yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Payments */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Recent Payments</h3>
            <span className="text-xs text-slate-400">Last 5 payments</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <th className="tbl-head">Ref #</th>
                <th className="tbl-head">Client</th>
                <th className="tbl-head">Method</th>
                <th className="tbl-head text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent_payments.length > 0 ? recent_payments.map(pmt => (
                <tr key={pmt.id} className="tbl-row">
                  <td className="tbl-cell text-slate-500 truncate max-w-[80px]">{pmt.reference_number || 'N/A'}</td>
                  <td className="tbl-cell font-semibold">{pmt.client_name}</td>
                  <td className="tbl-cell text-xs text-slate-500">{pmt.payment_method}</td>
                  <td className="tbl-cell text-right font-bold text-brand-600 dark:text-brand-400">+{formatCurrency(pmt.amount, user?.settings?.default_currency)}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="tbl-cell text-center text-slate-400 py-8">No payments yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PageHeader = ({ businessName, ownerName, logoUrl, refreshing, handleRefresh }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="w-11 h-11 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-800 p-0.5 shadow-sm" />
      ) : (
        <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-200/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-base">
          {businessName.substring(0, 2).toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{businessName}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Welcome back, {ownerName}</p>
      </div>
    </div>
    <div className="flex items-center gap-2.5">
      <button onClick={handleRefresh} disabled={refreshing}
        className="btn-secondary gap-2 disabled:opacity-50">
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </button>
      <Link to="/invoices/new" className="btn-primary">
        <Plus className="w-4 h-4" /> New Invoice
      </Link>
    </div>
  </div>
);

export default Dashboard;
