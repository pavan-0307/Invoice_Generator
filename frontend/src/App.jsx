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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
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

        {/* Backend connection indicator */}
        <div className="fixed bottom-4 right-4 z-[9999] no-print">
          {apiStatus === 'unreachable' && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Backend Not Reachable
            </div>
          )}
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
