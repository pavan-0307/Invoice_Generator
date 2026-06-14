import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Receipt, Mail, Lock, User, Briefcase, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFormValidation } from '../hooks/useFormValidation';

const validateRegister = (values) => {
  const errors = {};
  if (!values.businessName) {
    errors.businessName = 'Business name is required';
  } else if (values.businessName.length < 3) {
    errors.businessName = 'Business name must be at least 3 characters';
  } else if (values.businessName.length > 100) {
    errors.businessName = 'Business name must not exceed 100 characters';
  }
  if (!values.ownerName) {
    errors.ownerName = 'Owner name is required';
  } else if (values.ownerName.length < 3) {
    errors.ownerName = 'Owner name must be at least 3 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(values.ownerName)) {
    errors.ownerName = 'Owner name must contain only alphabets and spaces';
  }
  if (!values.email) {
    errors.email = 'Please enter your email';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!values.password) {
    errors.password = 'Password must contain at least 8 characters, one uppercase letter, one number and one special character';
  } else {
    const hasUppercase = /[A-Z]/.test(values.password);
    const hasLowercase = /[a-z]/.test(values.password);
    const hasNumber = /[0-9]/.test(values.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(values.password);
    if (values.password.length < 8 || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      errors.password = 'Password must contain at least 8 characters, one uppercase letter, one number and one special character';
    }
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Confirm Password must match Password';
  }
  return errors;
};

const Field = ({ label, children, error, touched }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
    {touched && error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
  </div>
);

const Register = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const memoizedValidate = useCallback((vals) => validateRegister(vals), []);
  const { values, errors, touched, isValid, handleChange, handleBlur } = useFormValidation(
    { businessName: '', ownerName: '', email: '', password: '', confirmPassword: '' },
    memoizedValidate
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isValid) return;
    setSubmitting(true);
    try {
      const result = await register(values.businessName, values.ownerName, values.email, values.password);
      if (result.success) {
        toast.success('Registration Successful');
        setSuccess('Account created! Logging you in...');
        const loginResult = await login(values.email, values.password);
        setSubmitting(false);
        if (loginResult.success) {
          toast.success('Login Successful');
          navigate('/dashboard');
        } else {
          setError('Registration succeeded but auto-login failed. Please sign in manually.');
          toast.error('Auto-login failed. Please sign in manually.');
        }
      } else {
        setSubmitting(false);
        setError(result.message || 'Registration failed.');
        toast.error(result.message || 'Registration failed.');
      }
    } catch (err) {
      setSubmitting(false);
      const msg = err.message || 'Registration failed.';
      setError(msg);
      toast.error(msg);
    }
  };

  const inputCls = (field) => {
    const base = 'input pl-10';
    if (!touched[field]) return base;
    return errors[field] ? 'input-error pl-10' : `${base} border-brand-500 focus:ring-brand-500/30`;
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-between p-12" style={{ background: '#0b1120' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-brand">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl tracking-tight leading-none">ClearLedger</p>
            <p className="text-slate-500 text-xs">Invoice Management</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
              ✦ Free to get started
            </span>
            <h1 className="text-3xl font-bold text-white leading-tight tracking-tight">
              Start managing<br />
              <span className="text-brand-400">your business.</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Join thousands of small business owners who use ClearLedger to manage invoices, clients, and payments — all in one place.
            </p>
          </div>
          <ul className="space-y-2.5">
            {['Unlimited invoice creation', 'Multi-client management', 'Real-time payment tracking', 'Financial reports & exports'].map(f => (
              <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-slate-600 text-xs">© 2026 ClearLedger. All rights reserved.</p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md py-8 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-brand">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-900 dark:text-white font-bold text-xl tracking-tight">ClearLedger</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create your account</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-700 dark:text-rose-400 text-sm">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Field label="Business Name" error={errors.businessName} touched={touched.businessName}>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="businessName" name="businessName" type="text" required value={values.businessName}
                  onChange={handleChange} onBlur={handleBlur} className={inputCls('businessName')} placeholder="Acme Corporation" />
              </div>
            </Field>

            <Field label="Owner Name" error={errors.ownerName} touched={touched.ownerName}>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="ownerName" name="ownerName" type="text" required value={values.ownerName}
                  onChange={handleChange} onBlur={handleBlur} className={inputCls('ownerName')} placeholder="John Doe" />
              </div>
            </Field>

            <Field label="Email Address" error={errors.email} touched={touched.email}>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="email" name="email" type="email" required value={values.email}
                  onChange={handleChange} onBlur={handleBlur} className={inputCls('email')} placeholder="john@example.com" />
              </div>
            </Field>

            <Field label="Password" error={errors.password} touched={touched.password}>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} required
                  value={values.password} onChange={handleChange} onBlur={handleBlur}
                  className={`${inputCls('password')} pr-10`} placeholder="Min. 8 chars, 1 upper, 1 number, 1 special" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <Field label="Confirm Password" error={errors.confirmPassword} touched={touched.confirmPassword}>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required
                  value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                  className={`${inputCls('confirmPassword')} pr-10`} placeholder="Repeat your password" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <button type="submit" disabled={!isValid || submitting}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
