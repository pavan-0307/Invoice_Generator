import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import api from './services/api';
import ToastProvider from './components/common/ToastProvider';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceDetails from './pages/InvoiceDetails';
import Reports from './pages/Reports';
import APITest from './pages/APITest';
import Settings from './pages/Settings';

const ProtectedLayout = ({ children }) => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

function App() {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    api.get('/health')
      .then(res => {
        if (res.data.success) {
          setApiStatus('connected');
        } else {
          setApiStatus('unreachable');
        }
      })
      .catch(() => {
        setApiStatus('unreachable');
      });
  }, []);

  return (
    <AuthProvider>
      <ToastProvider />
      <BrowserRouter>
        <Routes>
          {/* Guest Routes */}
          <Route path="/login" element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          } />
          
          <Route path="/register" element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </ProtectedRoute>
          } />

          <Route path="/clients" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Clients />
              </ProtectedLayout>
            </ProtectedRoute>
          } />

          <Route path="/invoices" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Invoices />
              </ProtectedLayout>
            </ProtectedRoute>
          } />

          <Route path="/invoices/new" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InvoiceCreate />
              </ProtectedLayout>
            </ProtectedRoute>
          } />

          <Route path="/invoices/:id" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InvoiceDetails />
              </ProtectedLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Reports />
              </ProtectedLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Settings />
              </ProtectedLayout>
            </ProtectedRoute>
          } />

          {/* Diagnostic page */}
          <Route path="/api-test" element={<APITest />} />

          {/* Fallback redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Global Connection status floating indicator */}
        <div className="fixed bottom-4 right-4 z-[9999] no-print">
          {apiStatus === 'unreachable' && (
            <div className="flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-455 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-rose-500/5 backdrop-blur-sm transition-all duration-300">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
              <span>Backend Not Reachable</span>
            </div>
          )}
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
