import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Receipt, Mail, Lock, User, Briefcase, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
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

const Register = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const memoizedValidate = useCallback((vals) => validateRegister(vals), []);

  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
  } = useFormValidation(
    {
      businessName: '',
      ownerName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
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
        
        // Auto-login after registration
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

  const getInputClass = (fieldName) => {
    const isPassword = fieldName === 'password' || fieldName === 'confirmPassword';
    const defaultClass = `block w-full pl-10 ${isPassword ? 'pr-10' : 'pr-3'} py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-colors sm:text-sm`;
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
          Create your portal account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl border border-slate-200/50 dark:border-slate-800/80 sm:rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-4 rounded-r-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-sm text-rose-800 dark:text-rose-350">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-start space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 animate-ping"></div>
                <span className="text-sm text-emerald-800 dark:text-emerald-350 font-medium">{success}</span>
              </div>
            )}

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 dark:text-slate-350">
                Business Name
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  value={values.businessName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass('businessName')}
                  placeholder="Acme Corporation"
                />
              </div>
              {touched.businessName && errors.businessName && (
                <p className="mt-1 text-xs text-rose-500">{errors.businessName}</p>
              )}
            </div>

            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-slate-700 dark:text-slate-350">
                Owner Name
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  required
                  value={values.ownerName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass('ownerName')}
                  placeholder="John Doe"
                />
              </div>
              {touched.ownerName && errors.ownerName && (
                <p className="mt-1 text-xs text-rose-500">{errors.ownerName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-350">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass('email')}
                  placeholder="john@example.com"
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
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass('password')}
                  placeholder="Min. 8 characters"
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
                <p className="mt-1 text-xs text-rose-500 leading-normal">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-350">
                Confirm Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass('confirmPassword')}
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-550 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="h-5 h-5" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all shadow-md shadow-brand-500/10 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
                {!submitting && <ArrowRight className="w-4.5 h-4.5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
