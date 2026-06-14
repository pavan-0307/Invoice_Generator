import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Activity, Wifi, WifiOff, Database, RefreshCw, ArrowLeft, CheckCircle2, XCircle, Globe } from 'lucide-react';

const APITest = () => {
  const [status, setStatus] = useState('checking'); // checking | connected | error
  const [dbStatus, setDbStatus] = useState('checking'); // checking | connected | error
  const [latency, setLatency] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkConnection = async () => {
    setIsRefreshing(true);
    setErrorMessage('');
    const startTime = performance.now();
    try {
      // 1. Call GET /api/health
      const response = await api.get('/health');
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));

      if (response.data.success) {
        setStatus('connected');
      } else {
        setStatus('error');
        setErrorMessage(response.data.message || 'Unknown response from health endpoint.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Network request failed. Could not reach backend.');
    }

    // 2. Call GET /api/db-test
    try {
      const dbResponse = await api.get('/db-test');
      if (dbResponse.data.success) {
        setDbStatus('connected');
      } else {
        setDbStatus('error');
      }
    } catch (err) {
      setDbStatus('error');
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-xs font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/25">
            <Activity className="w-6.5 h-6.5" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
          System Diagnostics
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Verify and test the connectivity between React, PHP, and MySQL.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-6">
          
          {/* Health Status Block */}
          <div className="text-center space-y-4">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Connection Health</span>
            
            {status === 'checking' && (
              <div className="flex flex-col items-center py-4 space-y-3">
                <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500 font-medium animate-pulse">Running health check...</p>
              </div>
            )}

            {status === 'connected' && (
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                  <Wifi className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-emerald-650 dark:text-emerald-450">Backend Connected</h3>
                <p className="text-xs text-slate-400">Vite is communicating perfectly with PHP server.</p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 mx-auto shadow-inner">
                  <WifiOff className="w-8 h-8 animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-rose-650 dark:text-rose-450">Backend Not Reachable</h3>
                <p className="text-xs text-slate-400">Failed to establish connection with local API.</p>
              </div>
            )}
          </div>

          {/* Diagnostics Details */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnostics logs</h4>
            
            <div className="space-y-3 text-xs">
              {/* API URL Config */}
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center space-x-2.5">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">API Gateway</span>
                </div>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</span>
              </div>

              {/* Database Connection */}
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center space-x-2.5">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Database Status</span>
                </div>
                <div className="flex items-center space-x-1">
                  {dbStatus === 'checking' && (
                    <span className="text-slate-400 animate-pulse font-medium">Testing...</span>
                  )}
                  {dbStatus === 'connected' && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-450 font-bold">Connected (invoice_portal)</span>
                    </>
                  )}
                  {dbStatus === 'error' && (
                    <>
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span className="text-rose-650 dark:text-rose-450 font-bold">Connection Failed</span>
                    </>
                  )}
                </div>
              </div>

              {/* Latency */}
              {status === 'connected' && latency !== null && (
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center space-x-2.5">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Response Latency</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{latency} ms</span>
                </div>
              )}

              {/* Error Log Banner */}
              {status === 'error' && errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-350 rounded-xl font-mono text-[10px] break-words whitespace-pre-wrap border border-rose-200/50">
                  <span className="font-bold block uppercase mb-1">Error message:</span>
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={checkConnection}
              disabled={isRefreshing}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-75 transition-all shadow-md shadow-brand-500/10 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Running Diagnostic...' : 'Re-Run Diagnostic'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default APITest;
