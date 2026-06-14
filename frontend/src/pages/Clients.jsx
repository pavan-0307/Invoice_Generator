import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  X,
  Loader,
  Calendar,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalTouched, setModalTouched] = useState({});
  const [modalErrors, setModalErrors] = useState({});

  // Delete State
  const [deletingId, setDeletingId] = useState(null);

  const validateClientData = (data) => {
    const errors = {};
    if (!data.client_name) {
      errors.client_name = 'Client name is required';
    } else if (data.client_name.length < 3) {
      errors.client_name = 'Client name must be at least 3 characters';
    } else if (data.client_name.length > 100) {
      errors.client_name = 'Client name must not exceed 100 characters';
    }

    if (!data.email) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!data.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(data.phone)) {
      errors.phone = 'Enter a valid 10-digit mobile number';
    }

    if (!data.address) {
      errors.address = 'Address is required';
    } else if (data.address.length < 10) {
      errors.address = 'Address must be at least 10 characters';
    }

    return errors;
  };

  useEffect(() => {
    setModalErrors(validateClientData(formData));
  }, [formData]);

  useEffect(() => {
    fetchClients();
  }, [search]); // Re-fetch on search change

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clients?search=${encodeURIComponent(search)}`);
      if (response.data.success) {
        setClients(response.data.clients);
      } else {
        setError('Failed to fetch clients.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to the backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({
      client_name: '',
      email: '',
      phone: '',
      address: ''
    });
    setModalTouched({});
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setFormData({
      client_name: client.client_name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || ''
    });
    setModalTouched({ client_name: true, email: true, phone: true, address: true });
    setModalError('');
    setShowModal(true);
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
      // Mark all as touched
      setModalTouched({ client_name: true, email: true, phone: true, address: true });
      return;
    }

    setModalSubmitting(true);
    try {
      let response;
      if (editingClient) {
        // Update
        response = await api.put(`/clients/${editingClient.id}`, formData);
        if (response.data.success) {
          toast.success('Client Updated Successfully');
          setShowModal(false);
          fetchClients();
        } else {
          setModalError(response.data.message || 'Failed to update client.');
          toast.error(response.data.message || 'Failed to update client.');
        }
      } else {
        // Create
        response = await api.post('/clients', formData);
        if (response.data.success) {
          toast.success('Client Added Successfully');
          setShowModal(false);
          fetchClients();
        } else {
          setModalError(response.data.message || 'Failed to create client.');
          toast.error(response.data.message || 'Failed to create client.');
        }
      }
    } catch (err) {
      setModalError(err.message || 'Failed to submit client details.');
      toast.error(err.message || 'Network Connection Error');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteClient = async (id) => {
    setError('');
    setIsDeleting(true);
    try {
      const response = await api.delete(`/clients/${id}`);
      if (response.data.success) {
        setClients(prev => prev.filter(c => c.id !== id));
        toast.success('Client Deleted Successfully');
        setDeletingId(null);
      } else {
        setError(response.data.message || 'Failed to delete client.');
        toast.error(response.data.message || 'Failed to delete client.');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete client. They may have active invoices.');
      toast.error('Failed to delete client.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getModalInputClass = (fieldName) => {
    const defaultClass = "block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-750 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-colors sm:text-sm";
    if (!modalTouched[fieldName]) {
      return `${defaultClass} focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500`;
    }
    if (modalErrors[fieldName]) {
      return `${defaultClass} border-rose-500 dark:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500`;
    }
    return `${defaultClass} border-emerald-500 dark:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`;
  };

  const isModalFormValid = Object.keys(modalErrors).length === 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header and Add client */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Client Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add, update, and search customer records.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand-500/10 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Main filter/search card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-450" />
          </div>
          <input
            type="text"
            placeholder="Search by client name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors sm:text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-4 rounded-r-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span className="text-sm text-rose-800 dark:text-rose-350">{error}</span>
        </div>
      )}

      {/* Clients Display Grid */}
      {loading && clients.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.length > 0 ? (
            clients.map((client) => (
              <div 
                key={client.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-slate-850 dark:text-white truncate max-w-[80%]">{client.client_name}</h3>
                    <div className="flex space-x-1.5 no-print">
                      <button 
                        onClick={() => handleOpenEdit(client)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                        title="Edit Client"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingId(client.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body contact details */}
                  <div className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-2.5">
                      <Mail className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <Phone className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                      <span>{client.phone || '— No phone'}</span>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{client.address || '— No address provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer date info */}
                <div className="mt-5 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Added: {new Date(client.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-dashed border-slate-350 dark:border-slate-800 py-16 text-center rounded-2xl">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-slate-700 dark:text-slate-300 font-semibold text-lg">No clients found. Add your first client.</h3>
              <p className="text-slate-455 dark:text-slate-500 text-sm mt-1">Get started by creating your first client contact.</p>
              <button 
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 hover:scale-[1.02] active:scale-[0.98] transition-all text-white rounded-xl text-sm font-semibold cursor-pointer"
              >
                Add Client Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-850 dark:text-white">
                {editingClient ? 'Edit Client Profile' : 'Add New Client'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-650 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-rose-50 dark:bg-rose-955/20 border-l-4 border-rose-500 p-3.5 rounded-r-lg flex items-start space-x-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span className="text-xs text-rose-800 dark:text-rose-350">{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Client Name *</label>
                <input
                  type="text"
                  name="client_name"
                  required
                  value={formData.client_name}
                  onChange={handleInputChange}
                  onBlur={handleModalBlur}
                  className={getModalInputClass('client_name')}
                  placeholder="e.g. John Doe Corp"
                />
                {modalTouched.client_name && modalErrors.client_name && (
                  <p className="mt-1 text-xs text-rose-500">{modalErrors.client_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleModalBlur}
                  className={getModalInputClass('email')}
                  placeholder="e.g. billing@domain.com"
                />
                {modalTouched.email && modalErrors.email && (
                  <p className="mt-1 text-xs text-rose-500">{modalErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleModalBlur}
                  className={getModalInputClass('phone')}
                  placeholder="e.g. 9876543210"
                />
                {modalTouched.phone && modalErrors.phone && (
                  <p className="mt-1 text-xs text-rose-500">{modalErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Billing Address *</label>
                <textarea
                  name="address"
                  rows="3"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={handleModalBlur}
                  className={getModalInputClass('address')}
                  placeholder="e.g. 123 Business Rd, Suite 100"
                />
                {modalTouched.address && modalErrors.address && (
                  <p className="mt-1 text-xs text-rose-500">{modalErrors.address}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-750 text-slate-505 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isModalFormValid || modalSubmitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {modalSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Delete Confirmation Modal */}
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
