import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Receipt, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFormValidation } from '../hooks/useFormValidation';

const validateLogin = (values) => {
  const errors = {};
  if (!values.email) {
    errors.email = 'Please enter your email';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!values.password) {
    errors.password = 'Please enter your password';
  }
  return errors;
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const memoizedValidate = useCallback((vals) => validateLogin(vals), []);

  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
  } = useFormValidation(
    {
      email: '',
      password: '',
    },
    memoizedValidate
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isValid) return;

    setSubmitting(true);
    try {
      const result = await login(values.email, values.password);
      setSubmitting(false);

      if (result.success) {
        toast.success('Login Successful');
        navigate('/dashboard');
      } else {
        setError(result.message || 'Invalid email or password');
        toast.error(result.message || 'Invalid email or password');
      }
    } catch (err) {
      setSubmitting(false);
      const msg = err.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    }
  };

  const getInputClass = (fieldName) => {
    const defaultClass = `block w-full pl-10 ${fieldName === 'password' ? 'pr-10' : 'pr-3'} py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-colors sm:text-sm`;
    if (!touched[fieldName]) {
      return `${defaultClass} focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500`;
    }
    if (errors[fieldName]) {
      return `${defaultClass} border-rose-500 dark:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500`;
    }
    return `${defaultClass} border-emerald-500 dark:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/25">
            <Receipt className="w-6.5 h-6.5" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Or{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">
            register your business in minutes
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl border border-slate-200/50 dark:border-slate-800/80 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-4 rounded-r-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-sm text-rose-800 dark:text-rose-350">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-350">
                Email address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 h-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass('email')}
                  placeholder="name@company.com"
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-350">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 h-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass('password')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-550 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-rose-500">{errors.password}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all shadow-md shadow-brand-500/10 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                {!submitting && <ArrowRight className="w-4.5 h-4.5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
