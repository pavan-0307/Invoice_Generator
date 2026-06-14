import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Building,
  User,
  Mail,
  Phone,
  FileText,
  Lock,
  Bell,
  Palette,
  UploadCloud,
  Coins,
  Percent,
  Calendar,
  Users,
  Briefcase,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

const Settings = () => {
  const { user, checkAuth, theme, updateTheme } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total_clients: 0, total_invoices: 0 });

  // Profile Form State
  const [profile, setProfile] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    gst_number: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    default_tax_rate: 0,
    default_currency: 'INR',
    invoice_prefix: 'INV',
    payment_terms: '30 Days',
    payment_notifications: 1,
    invoice_notifications: 1,
    client_notifications: 1,
    email_notifications: 0,
    theme: 'Light',
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Logo State
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Errors state
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    fetchSettingsAndStats();
  }, []);

  useEffect(() => {
    if (user?.settings?.theme) {
      setProfile(prev => ({
        ...prev,
        theme: user.settings.theme
      }));
    } else if (theme) {
      setProfile(prev => ({
        ...prev,
        theme: theme
      }));
    }
  }, [user?.settings?.theme, theme]);

  const fetchSettingsAndStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        const s = res.data.settings;
        setProfile({
          business_name: s.business_name || '',
          owner_name: s.owner_name || '',
          email: s.email || '',
          phone: s.phone || '',
          gst_number: s.gst_number || '',
          address: s.address || '',
          city: s.city || '',
          state: s.state || '',
          country: s.country || '',
          postal_code: s.postal_code || '',
          default_tax_rate: parseFloat(s.default_tax_rate) || 0,
          default_currency: s.default_currency || 'INR',
          invoice_prefix: s.invoice_prefix || 'INV',
          payment_terms: s.payment_terms || '30 Days',
          payment_notifications: parseInt(s.payment_notifications) ?? 1,
          invoice_notifications: parseInt(s.invoice_notifications) ?? 1,
          client_notifications: parseInt(s.client_notifications) ?? 1,
          email_notifications: parseInt(s.email_notifications) ?? 0,
          theme: s.theme || 'Light',
        });
        if (s.logo_path) {
          setLogoPreview(`${import.meta.env.VITE_API_URL}/${s.logo_path}`);
        }
      }

      // Fetch dashboard metrics for profile card stats
      const dashRes = await api.get('/dashboard');
      if (dashRes.data.success) {
        setStats({
          total_clients: dashRes.data.metrics.total_clients,
          total_invoices: dashRes.data.metrics.total_invoices
        });
      }
    } catch (err) {
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  // Profile fields validation
  const validateProfile = () => {
    const errs = {};
    if (!profile.business_name.trim()) errs.business_name = 'Business name is required';
    else if (profile.business_name.length < 3) errs.business_name = 'Must be at least 3 characters';

    if (!profile.owner_name.trim()) errs.owner_name = 'Owner name is required';
    else if (!/^[a-zA-Z\s]+$/.test(profile.owner_name)) errs.owner_name = 'Only alphabets and spaces allowed';

    if (!profile.email.trim()) errs.email = 'Business email is required';
    else if (!/\S+@\S+\.\S+/.test(profile.email)) errs.email = 'Invalid email address';

    if (!profile.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(profile.phone)) errs.phone = 'Must be a valid 10-digit Indian number';

    if (!profile.address.trim()) errs.address = 'Address is required';
    if (!profile.city.trim()) errs.city = 'City is required';
    if (!profile.state.trim()) errs.state = 'State is required';
    if (!profile.country.trim()) errs.country = 'Country is required';
    if (!profile.postal_code.trim()) errs.postal_code = 'Postal code is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!validateProfile()) {
      toast.error('Please resolve profile validation errors.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/settings', profile);
      if (res.data.success) {
        toast.success('Profile Updated Successfully');
        await checkAuth(); // Refresh global auth contexts
      } else {
        toast.error(res.data.message || 'Update failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Password validation
  const validatePassword = () => {
    const errs = {};
    if (!passwordData.current_password) errs.current_password = 'Current password is required';
    
    const newPass = passwordData.new_password;
    if (!newPass) {
      errs.new_password = 'New password is required';
    } else {
      const hasUppercase = /[A-Z]/.test(newPass);
      const hasLowercase = /[a-z]/.test(newPass);
      const hasNumber = /[0-9]/.test(newPass);
      const hasSpecial = /[^A-Za-z0-9]/.test(newPass);
      if (newPass.length < 8 || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        errs.new_password = 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character';
      }
    }

    if (newPass !== passwordData.confirm_password) {
      errs.confirm_password = 'Passwords do not match';
    }

    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!validatePassword()) {
      toast.error('Please resolve password requirements.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/settings/password', passwordData);
      if (res.data.success) {
        toast.success('Password Changed Successfully');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setPasswordErrors({});
      } else {
        toast.error(res.data.message || 'Password update failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error changing password');
    } finally {
      setSaving(false);
    }
  };

  // Logo file selection and upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size must be less than 2MB.');
      return;
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast.error('Supported Formats: JPG, JPEG, PNG only');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Please select a logo file first.');
      return;
    }

    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      setSaving(true);
      const res = await api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Logo Uploaded Successfully');
        setLogoFile(null);
        await checkAuth(); // Refresh logo in sidebar & dashboard
      } else {
        toast.error(res.data.message || 'Logo upload failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error uploading logo');
    } finally {
      setSaving(false);
    }
  };

  const memberSinceFormatted = () => {
    if (!user || !user.settings?.created_at) return 'June 2026';
    const date = new Date(user.settings.created_at);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="lg:col-span-3 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: 'profile', label: 'Business Profile', icon: Building },
    { id: 'logo', label: 'Company Logo', icon: UploadCloud },
    { id: 'account', label: 'Account Security', icon: Lock },
    { id: 'invoice', label: 'Invoice Settings', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Settings & Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your business preferences and billing controls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar & Stats Card */}
        <div className="space-y-6">
          {/* Tabs Menu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/85 rounded-2xl p-2.5 shadow-sm space-y-1">
            {tabItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left ${
                    activeTab === item.id
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${activeTab === item.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Profile Card */}
          <div className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/60 border border-slate-200/60 dark:border-slate-800/85 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-500"></div>
            
            {/* Logo display as profile picture */}
            <div className="relative group">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Profile Logo"
                  className="w-20 h-20 rounded-2xl object-contain bg-white dark:bg-slate-850 p-1 border border-slate-200 dark:border-slate-800 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-950/20 border border-brand-200/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-2xl font-bold font-display shadow-inner">
                  {profile.business_name ? profile.business_name.substring(0, 2).toUpperCase() : 'CO'}
                </div>
              )}
            </div>

            <h3 className="font-bold text-slate-800 dark:text-white mt-4 text-base truncate max-w-full">{profile.business_name || 'My Business'}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{profile.owner_name || 'Business Owner'}</p>

            <div className="w-full border-t border-slate-100 dark:border-slate-800/80 my-4 pt-4 space-y-2.5 text-left text-xs">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-450">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{profile.email || user?.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-450">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-450">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Member Since: {memberSinceFormatted()}</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 w-full border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-1">
              <div className="bg-slate-50 dark:bg-slate-850/60 p-2.5 rounded-xl text-center">
                <div className="flex justify-center text-brand-500 mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <span className="block text-lg font-bold text-slate-800 dark:text-white">{stats.total_clients}</span>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Clients</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850/60 p-2.5 rounded-xl text-center">
                <div className="flex justify-center text-brand-500 mb-1">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="block text-lg font-bold text-slate-800 dark:text-white">{stats.total_invoices}</span>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Invoices</span>
              </div>
            </div>
          </div>
        </div>

        {/* Setting Forms Panel */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/85 rounded-2xl shadow-sm p-6 lg:p-8">
          
          {/* Tab 1: Business Profile Form */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-4">
                <Building className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-850 dark:text-white font-display">Business Profile Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Business Name</label>
                  <input
                    type="text"
                    name="business_name"
                    value={profile.business_name}
                    onChange={handleProfileChange}
                    className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${errors.business_name ? 'border-rose-500' : ''}`}
                    placeholder="E.g., Acme Corporation"
                  />
                  {errors.business_name && <p className="text-xs text-rose-500 mt-1">{errors.business_name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Owner Name</label>
                  <input
                    type="text"
                    name="owner_name"
                    value={profile.owner_name}
                    onChange={handleProfileChange}
                    className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${errors.owner_name ? 'border-rose-500' : ''}`}
                    placeholder="E.g., John Doe"
                  />
                  {errors.owner_name && <p className="text-xs text-rose-500 mt-1">{errors.owner_name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Business Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${errors.email ? 'border-rose-500' : ''}`}
                    placeholder="E.g., info@acme.com"
                  />
                  {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${errors.phone ? 'border-rose-500' : ''}`}
                    placeholder="10 digit Indian number"
                  />
                  {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">GST Number <span className="text-slate-400 text-[10px]">(Optional)</span></label>
                  <input
                    type="text"
                    name="gst_number"
                    value={profile.gst_number || ''}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">Business Address</label>
                <textarea
                  name="address"
                  value={profile.address}
                  onChange={handleProfileChange}
                  rows="3"
                  className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 ${errors.address ? 'border-rose-500' : ''}`}
                  placeholder="Street details..."
                />
                {errors.address && <p className="text-xs text-rose-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={profile.city}
                    onChange={handleProfileChange}
                    className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none transition-all focus:border-brand-500 ${errors.city ? 'border-rose-500' : ''}`}
                  />
                  {errors.city && <p className="text-xs text-rose-500 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={profile.state}
                    onChange={handleProfileChange}
                    className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none transition-all focus:border-brand-500 ${errors.state ? 'border-rose-500' : ''}`}
                  />
                  {errors.state && <p className="text-xs text-rose-500 mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={profile.country}
                    onChange={handleProfileChange}
                    className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none transition-all focus:border-brand-500 ${errors.country ? 'border-rose-500' : ''}`}
                  />
                  {errors.country && <p className="text-xs text-rose-500 mt-1">{errors.country}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Postal Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={profile.postal_code}
                    onChange={handleProfileChange}
                    className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm outline-none transition-all focus:border-brand-500 ${errors.postal_code ? 'border-rose-500' : ''}`}
                  />
                  {errors.postal_code && <p className="text-xs text-rose-500 mt-1">{errors.postal_code}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-brand-500/10 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Company Logo Upload */}
          {activeTab === 'logo' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-4">
                <UploadCloud className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-850 dark:text-white font-display">Company Logo Upload</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Upload your business logo. This logo will automatically appear on your dashboard headers, PDF print files, and email invoice delivery pages.
                  </p>
                  
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>• Supported Formats: <span className="font-semibold text-slate-600 dark:text-slate-300">JPG, JPEG, PNG</span></p>
                    <p>• Maximum Size: <span className="font-semibold text-slate-600 dark:text-slate-300">2MB</span></p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoChange}
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                  />

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Choose Logo File
                    </button>

                    {logoFile && (
                      <button
                        type="button"
                        onClick={handleLogoUpload}
                        disabled={saving}
                        className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {saving ? 'Uploading...' : 'Upload Logo'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl bg-slate-50/30 dark:bg-slate-900/40 min-h-48">
                  {logoPreview ? (
                    <div className="space-y-3 text-center">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="max-h-24 max-w-full object-contain mx-auto bg-white p-2 border border-slate-200/50 rounded-xl"
                      />
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-450">Active Logo Preview</span>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 space-y-2">
                      <Building className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
                      <span className="block text-xs">No logo uploaded yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Password Settings */}
          {activeTab === 'account' && (
            <form onSubmit={handlePasswordSave} className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-4">
                <Lock className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-850 dark:text-white font-display">Change Account Password</h2>
              </div>

              <div className="max-w-md space-y-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                      className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:border-brand-500 ${passwordErrors.current_password ? 'border-rose-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showCurrent ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {passwordErrors.current_password && <p className="text-xs text-rose-500 mt-1">{passwordErrors.current_password}</p>}
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:border-brand-500 ${passwordErrors.new_password ? 'border-rose-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showNew ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {passwordErrors.new_password && <p className="text-xs text-rose-500 mt-1 leading-normal">{passwordErrors.new_password}</p>}
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className={`w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:border-brand-500 ${passwordErrors.confirm_password ? 'border-rose-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {passwordErrors.confirm_password && <p className="text-xs text-rose-500 mt-1">{passwordErrors.confirm_password}</p>}
                </div>
              </div>

              {/* Password Rules Checklist */}
              <div className="bg-slate-50 dark:bg-slate-850/60 p-5 rounded-2xl text-xs space-y-2 border border-slate-100 dark:border-slate-800/80">
                <p className="font-bold text-slate-655 dark:text-slate-300">Password Requirements Checklist:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordData.new_password.length >= 8 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                    <span>At least 8 characters long</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(passwordData.new_password) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                    <span>At least one uppercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(passwordData.new_password) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                    <span>At least one number</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${/[^A-Za-z0-9]/.test(passwordData.new_password) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                    <span>At least one special character</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-brand-500/10 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 4: Invoice settings defaults */}
          {activeTab === 'invoice' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-4">
                <Coins className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-850 dark:text-white font-display">Invoice Generation Defaults</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Default Currency</label>
                  <select
                    name="default_currency"
                    value={profile.default_currency}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="INR">INR ₹ (Indian Rupee)</option>
                    <option value="USD">USD $ (US Dollar)</option>
                    <option value="EUR">EUR € (Euro)</option>
                    <option value="GBP">GBP £ (British Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Default Tax Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      name="default_tax_rate"
                      value={profile.default_tax_rate}
                      onChange={handleProfileChange}
                      className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:border-brand-500"
                      min="0"
                      max="100"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Percent className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Invoice Number Prefix</label>
                  <input
                    type="text"
                    name="invoice_prefix"
                    value={profile.invoice_prefix}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                    placeholder="E.g., INV"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Auto numbering uses format: <span className="font-semibold">{profile.invoice_prefix}-2026-0001</span></p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Payment Terms (Due Date Offset)</label>
                  <select
                    name="payment_terms"
                    value={profile.payment_terms}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-brand-500/10 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 5: Notification Preferences */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-4">
                <Bell className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-850 dark:text-white font-display">Notification Preferences</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Payment Notifications</h4>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Receive notifications when clients submit payments or records are updated.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="payment_notifications"
                      checked={profile.payment_notifications === 1}
                      onChange={handleProfileChange}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Invoice Notifications</h4>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Notify when new drafts are generated or status changes to overdue.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="invoice_notifications"
                      checked={profile.invoice_notifications === 1}
                      onChange={handleProfileChange}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Client Notifications</h4>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Alerts when client profiles are created, modified or merged.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="client_notifications"
                      checked={profile.client_notifications === 1}
                      onChange={handleProfileChange}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-2xl opacity-60">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Email Alerts <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-550 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase ml-1">Future Use</span></h4>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Send transaction copies directly to your configured profile email.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="email_notifications"
                      checked={profile.email_notifications === 1}
                      onChange={handleProfileChange}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-brand-500/10 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 6: Appearance settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-4">
                <Palette className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-850 dark:text-white font-display">Appearance Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Light Mode */}
                <button
                  type="button"
                  onClick={() => updateTheme('Light')}
                  className={`relative p-5 rounded-2xl border text-left flex flex-col space-y-4 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer ${
                    theme === 'Light'
                      ? 'border-brand-500 bg-brand-50/10 dark:bg-brand-950/5 ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Palette className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250">Light Mode</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">Clean visual theme designed for bright workspaces.</p>
                  </div>
                  {theme === 'Light' && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-500"></div>
                  )}
                </button>

                {/* Dark Mode */}
                <button
                  type="button"
                  onClick={() => updateTheme('Dark')}
                  className={`relative p-5 rounded-2xl border text-left flex flex-col space-y-4 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer ${
                    theme === 'Dark'
                      ? 'border-brand-500 bg-brand-50/10 dark:bg-brand-950/5 ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Palette className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250">Dark Mode</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">Sleek visual appearance designed for low-light contexts.</p>
                  </div>
                  {theme === 'Dark' && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-500"></div>
                  )}
                </button>

                {/* System Mode */}
                <button
                  type="button"
                  onClick={() => updateTheme('System')}
                  className={`relative p-5 rounded-2xl border text-left flex flex-col space-y-4 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer ${
                    theme === 'System'
                      ? 'border-brand-500 bg-brand-50/10 dark:bg-brand-950/5 ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-550">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250">System Theme</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">Matches local operating system preference switches.</p>
                  </div>
                  {theme === 'System' && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-500"></div>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
