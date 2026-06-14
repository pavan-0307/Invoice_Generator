import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../services/currency';
import { 
  Clock, 
  AlertTriangle, 
  Users, 
  FileText, 
  Plus, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      if (response.data.success) {
        setData(response.data);
      } else {
        setError('Failed to load dashboard data.');
        toast.error('Failed to load dashboard data.');
      }
    } catch (err) {
      setError('Connection error. Please ensure the API backend is running.');
      toast.error('Network Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/dashboard');
      if (response.data.success) {
        setData(response.data);
        toast.success('Data Refreshed Successfully');
      } else {
        toast.error('Failed to load dashboard data.');
      }
    } catch (err) {
      toast.error('Network Connection Error');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Dashboard Error</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-5 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { metrics, trends, distribution, recent_invoices, recent_payments } = data;

  if (metrics.total_invoices === 0 && metrics.total_clients === 0) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Dashboard Overview</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time business performance metrics.</p>
          </div>
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <Link 
              to="/invoices/new" 
              className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </Link>
          </div>
        </div>

        {/* Empty state container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">No business activity available.</h3>
            <p className="text-sm text-slate-500 dark:text-slate-450 max-w-sm">Create clients and invoices to start tracking revenue and billing transactions.</p>
          </div>
          <div className="flex space-x-3 pt-2">
            <Link 
              to="/clients" 
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Add Client
            </Link>
            <Link 
              to="/invoices/new" 
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Create Invoice
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals for distribution percentage
  const totalInvoicesDist = Object.values(distribution).reduce((a, b) => a + b, 0);

  // SVG Chart Computations
  const maxRevenue = Math.max(...trends.map(t => t.revenue), 1000);
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  const points = trends.map((t, i) => {
    const x = padding + (i / Math.max(trends.length - 1, 1)) * graphWidth;
    const y = chartHeight - padding - (t.revenue / maxRevenue) * graphHeight;
    return `${x},${y}`;
  });

  const linePath = points.join(' ');
  const areaPath = points.length 
    ? `${points[0].split(',')[0]},${chartHeight - padding} ` + linePath + ` ${points[points.length - 1].split(',')[0]},${chartHeight - padding}`
    : '';

  const statusColorMap = {
    Paid: 'bg-emerald-500 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30',
    Pending: 'bg-indigo-500 text-indigo-700 dark:text-indigo-400 border-indigo-250 dark:border-indigo-900/30',
    'Partially Paid': 'bg-amber-500 text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-900/30',
    Overdue: 'bg-rose-500 text-rose-700 dark:text-rose-400 border-rose-250 dark:border-rose-900/30',
    Draft: 'bg-slate-400 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800/30'
  };

  const getStatusClass = (status) => {
    return statusColorMap[status] || 'bg-slate-400';
  };

  const logoUrl = user?.settings?.logo_path ? `${import.meta.env.VITE_API_URL}/${user.settings.logo_path}` : null;
  const businessName = user?.settings?.business_name || user?.business_name || 'Dashboard Overview';
  const ownerName = user?.settings?.owner_name || user?.owner_name || 'Business Owner';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Upper header action banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-800 p-0.5 shadow-sm" 
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-200/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold font-display text-lg">
              {businessName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">{businessName}</h1>
            <p className="text-sm text-slate-550 dark:text-slate-400 mt-0.5">Welcome back, {ownerName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          
          <Link 
            to="/invoices/new" 
            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-450">{formatCurrency(metrics.total_revenue, user?.settings?.default_currency)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-650 text-base font-bold font-display">
            {getCurrencySymbol(user?.settings?.default_currency)}
          </div>
        </div>

        {/* Pending Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Amount</span>
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(metrics.pending_amount, user?.settings?.default_currency)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-650 text-base font-bold font-display">
            {getCurrencySymbol(user?.settings?.default_currency)}
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overdue Amount</span>
            <h3 className="text-xl font-bold text-rose-600 dark:text-rose-450">{formatCurrency(metrics.overdue_amount, user?.settings?.default_currency)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-650 text-base font-bold font-display">
            {getCurrencySymbol(user?.settings?.default_currency)}
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Clients</span>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{metrics.total_clients}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-450">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Invoices</span>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{metrics.total_invoices}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-450">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics segment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-800 dark:text-white">Monthly Revenue Trend</h3>
            </div>
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last 6 months</span>
            </span>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#445ee2" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#445ee2" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" className="stroke-slate-250 dark:stroke-slate-800" />
              <line x1={padding} y1={padding + graphHeight / 2} x2={chartWidth - padding} y2={padding + graphHeight / 2} stroke="#e2e8f0" strokeDasharray="3 3" className="stroke-slate-250 dark:stroke-slate-800" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#cbd5e1" className="stroke-slate-300 dark:stroke-slate-800" />

              {/* Area fill */}
              {areaPath && <path d={areaPath} fill="url(#chartGrad)" />}

              {/* Stroke line */}
              {linePath && <path d={linePath} fill="none" stroke="#445ee2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

              {/* Data dots */}
              {trends.map((t, i) => {
                const x = padding + (i / Math.max(trends.length - 1, 1)) * graphWidth;
                const y = chartHeight - padding - (t.revenue / maxRevenue) * graphHeight;
                return (
                  <g key={i} className="group">
                    <circle cx={x} cy={y} r="4.5" fill="#ffffff" stroke="#445ee2" strokeWidth="2.5" />
                    <circle cx={x} cy={y} r="8" fill="#445ee2" fillOpacity="0" className="hover:fill-opacity-10 cursor-pointer" />
                    {/* Tooltip trigger */}
                    <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" className="fill-slate-700 dark:fill-slate-350 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {getCurrencySymbol(user?.settings?.default_currency)}{t.revenue.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Labels */}
              {trends.map((t, i) => {
                const x = padding + (i / Math.max(trends.length - 1, 1)) * graphWidth;
                return (
                  <text key={i} x={x} y={chartHeight - 10} textAnchor="middle" fontSize="9" fontWeight="500" className="fill-slate-400 dark:fill-slate-500">
                    {t.name.split(' ')[0]}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Invoice Status Distribution Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Invoice Status Distribution</h3>
            <div className="space-y-4">
              {Object.entries(distribution).map(([status, count]) => {
                const pct = totalInvoicesDist > 0 ? (count / totalInvoicesDist) * 100 : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">{status}</span>
                      <span className="text-slate-800 dark:text-white">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          status === 'Paid' ? 'bg-emerald-500' :
                          status === 'Pending' ? 'bg-indigo-500' :
                          status === 'Partially Paid' ? 'bg-amber-500' :
                          status === 'Overdue' ? 'bg-rose-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Total categorized invoices</span>
            <span className="font-bold text-slate-650 dark:text-slate-350">{totalInvoicesDist}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity List Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <h3 className="font-bold text-slate-850 dark:text-white">Recent Invoices</h3>
              <Link to="/invoices" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/10 text-xs font-semibold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800/80">
                    <th className="px-5 py-3">Invoice #</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recent_invoices.length > 0 ? (
                    recent_invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          <Link to={`/invoices/${inv.id}`} className="hover:text-brand-650 flex items-center space-x-1">
                            <span>{inv.invoice_number}</span>
                            <ArrowUpRight className="w-3 h-3 text-slate-400" />
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{inv.client_name}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-855 dark:text-white">{formatCurrency(inv.grand_total, user?.settings?.default_currency)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusClass(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-slate-400">No invoices recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Payments Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <h3 className="font-bold text-slate-850 dark:text-white">Recent Payments</h3>
              <span className="text-xs text-slate-400">Last 5 payments</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/10 text-xs font-semibold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800/80">
                    <th className="px-5 py-3">Ref #</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recent_payments.length > 0 ? (
                    recent_payments.map((pmt) => (
                      <tr key={pmt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-550 dark:text-slate-400 truncate max-w-[80px]">{pmt.reference_number || 'N/A'}</td>
                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-semibold">{pmt.client_name}</td>
                        <td className="px-5 py-3.5 text-xs font-medium text-slate-500 dark:text-slate-400">{pmt.payment_method}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-emerald-650 dark:text-emerald-400">+{formatCurrency(pmt.amount, user?.settings?.default_currency)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-slate-400">No payments registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
