import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus, Search, Edit2, Trash2, Mail, Phone, MapPin,
  X, Loader, Calendar, Users, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';

/* Deterministic avatar color from name */
const avatarColor = (name = '') => {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-brand-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const validateClientData = (data) => {
  const errors = {};
  if (!data.client_name) errors.client_name = 'Client name is required';
  else if (data.client_name.length < 3) errors.client_name = 'Client name must be at least 3 characters';
  else if (data.client_name.length > 100) errors.client_name = 'Client name must not exceed 100 characters';
  if (!data.email) errors.email = 'Email address is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email address';
  if (!data.phone) errors.phone = 'Phone number is required';
  else if (!/^[6-9]\d{9}$/.test(data.phone)) errors.phone = 'Enter a valid 10-digit mobile number';
  if (!data.address) errors.address = 'Address is required';
  else if (data.address.length < 10) errors.address = 'Address must be at least 10 characters';
  return errors;
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ client_name: '', email: '', phone: '', address: '' });
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalTouched, setModalTouched] = useState({});
  const [modalErrors, setModalErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { setModalErrors(validateClientData(formData)); }, [formData]);
  useEffect(() => { fetchClients(); }, [search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clients?search=${encodeURIComponent(search)}`);
      if (response.data.success) setClients(response.data.clients);
      else setError('Failed to fetch clients.');
    } catch (err) { setError(err.message || 'Error connecting to the backend.'); }
    finally { setLoading(false); }
  };

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({ client_name: '', email: '', phone: '', address: '' });
    setModalTouched({}); setModalError(''); setShowModal(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setFormData({ client_name: client.client_name, email: client.email, phone: client.phone || '', address: client.address || '' });
    setModalTouched({ client_name: true, email: true, phone: true, address: true });
    setModalError(''); setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleModalBlur = (e) => {
    const { name } = e.target;
    setModalTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    const validationErrs = validateClientData(formData);
    if (Object.keys(validationErrs).length > 0) {
      setModalErrors(validationErrs);
      setModalTouched({ client_name: true, email: true, phone: true, address: true });
      return;
    }
    setModalSubmitting(true);
    try {
      let response;
      if (editingClient) {
        response = await api.put(`/clients/${editingClient.id}`, formData);
        if (response.data.success) { toast.success('Client Updated Successfully'); setShowModal(false); fetchClients(); }
        else { setModalError(response.data.message || 'Failed to update client.'); toast.error(response.data.message || 'Failed to update client.'); }
      } else {
        response = await api.post('/clients', formData);
        if (response.data.success) { toast.success('Client Added Successfully'); setShowModal(false); fetchClients(); }
        else { setModalError(response.data.message || 'Failed to create client.'); toast.error(response.data.message || 'Failed to create client.'); }
      }
    } catch (err) {
      setModalError(err.message || 'Failed to submit client details.');
      toast.error(err.message || 'Network Connection Error');
    } finally { setModalSubmitting(false); }
  };

  const handleDeleteClient = async (id) => {
    setError(''); setIsDeleting(true);
    try {
      const response = await api.delete(`/clients/${id}`);
      if (response.data.success) { setClients(prev => prev.filter(c => c.id !== id)); toast.success('Client Deleted Successfully'); setDeletingId(null); }
      else { setError(response.data.message || 'Failed to delete client.'); toast.error(response.data.message || 'Failed to delete client.'); }
    } catch (err) { setError(err.message || 'Failed to delete client.'); toast.error('Failed to delete client.'); }
    finally { setIsDeleting(false); }
  };

  const getInputCls = (field) => {
    if (!modalTouched[field]) return 'input';
    return modalErrors[field] ? 'input-error' : 'input border-brand-500 focus:ring-brand-500/30';
  };

  const isModalFormValid = Object.keys(modalErrors).length === 0;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Client Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Add, update, and search customer records.</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by client name, email or phone..."
            value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      {/* Clients Grid */}
      {loading && clients.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.length > 0 ? clients.map(client => (
            <div key={client.id} className="card p-5 flex flex-col justify-between hover:shadow-card-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${avatarColor(client.client_name)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {getInitials(client.client_name)}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate max-w-[160px]">
                      {client.client_name}
                    </h3>
                  </div>
                  <div className="flex gap-1 shrink-0 no-print">
                    <button onClick={() => handleOpenEdit(client)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                      title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeletingId(client.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{client.phone || '— No phone'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{client.address || '— No address'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                Added {new Date(client.created_at).toLocaleDateString()}
              </div>
            </div>
          )) : (
            <div className="col-span-full card p-16 text-center">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">No clients found</h3>
              <p className="text-slate-400 text-sm mt-1 mb-4">Get started by creating your first client.</p>
              <button onClick={handleOpenAdd} className="btn-primary mx-auto">
                <Plus className="w-4 h-4" /> Add Client Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="card max-w-md w-full shadow-card-lg animate-scale-in overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-700 dark:text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{modalError}
                </div>
              )}

              {[
                { label: 'Client Name *', name: 'client_name', type: 'text', placeholder: 'e.g. Acme Corporation' },
                { label: 'Email Address *', name: 'email', type: 'email', placeholder: 'e.g. billing@domain.com' },
                { label: 'Phone Number *', name: 'phone', type: 'text', placeholder: 'e.g. 9876543210' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input type={f.type} name={f.name} required value={formData[f.name]}
                    onChange={handleInputChange} onBlur={handleModalBlur}
                    className={getInputCls(f.name)} placeholder={f.placeholder} />
                  {modalTouched[f.name] && modalErrors[f.name] && (
                    <p className="mt-1 text-xs text-rose-500">{modalErrors[f.name]}</p>
                  )}
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Billing Address *</label>
                <textarea name="address" rows={3} required value={formData.address}
                  onChange={handleInputChange} onBlur={handleModalBlur}
                  className={getInputCls('address')} placeholder="e.g. 123 Business Rd, Suite 100" />
                {modalTouched.address && modalErrors.address && (
                  <p className="mt-1 text-xs text-rose-500">{modalErrors.address}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={!isModalFormValid || modalSubmitting} className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
                  {modalSubmitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => handleDeleteClient(deletingId)}
        title="Confirm Action"
        message="Are you sure you want to continue?"
        confirmText="Confirm"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </div>
  );
};

export default Clients;
