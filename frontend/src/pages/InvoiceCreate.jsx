import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../services/currency';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  ArrowLeft,
  Calendar,
  Percent,
  FileText,
  Save,
  Users
} from 'lucide-react';

const validateInvoice = (invoiceDate, dueDate, taxRate, items) => {
  const errs = {};
  
  if (!invoiceDate) {
    errs.invoiceDate = 'Invoice date is required';
  }
  if (!dueDate) {
    errs.dueDate = 'Due date is required';
  } else if (invoiceDate && new Date(dueDate) < new Date(invoiceDate)) {
    errs.dueDate = 'Due date must be greater than or equal to Invoice Date';
  }

  const rate = parseFloat(taxRate);
  if (isNaN(rate) || taxRate === '') {
    errs.taxRate = 'Tax rate is required';
  } else if (rate < 0 || rate > 100) {
    errs.taxRate = 'Tax rate must be between 0 and 100';
  }

  if (!items || items.length === 0) {
    errs.itemsGeneral = 'At least one invoice item is required';
  } else {
    const itemErrors = [];
    items.forEach((item, index) => {
      const itemErr = {};
      if (!item.description.trim()) {
        itemErr.description = 'Description is required';
      }
      
      if (item.quantity === '' || item.quantity === null || item.quantity === undefined) {
        itemErr.quantity = 'Quantity is required';
      } else {
        const qty = parseFloat(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          itemErr.quantity = 'Quantity must be greater than zero';
        }
      }

      if (item.unit_price === '' || item.unit_price === null || item.unit_price === undefined) {
        itemErr.unit_price = 'Unit price is required';
      } else {
        const price = parseFloat(item.unit_price);
        if (isNaN(price) || price <= 0) {
          itemErr.unit_price = 'Unit price must be greater than zero';
        }
      }
      
      if (Object.keys(itemErr).length > 0) {
        itemErrors[index] = itemErr;
      }
    });
    if (itemErrors.some(e => e)) {
      errs.items = itemErrors;
    }
  }

  return errs;
};

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(0.00);
  const [status, setStatus] = useState('Pending'); // 'Draft' or 'Pending'
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0.00 }
  ]);

  // Handle settings defaults mapping
  useEffect(() => {
    if (user?.settings) {
      setTaxRate(parseFloat(user.settings.default_tax_rate) || 0.00);
    }
  }, [user?.settings]);

  // Dynamically calculate due date on invoice date or payment terms changes
  useEffect(() => {
    if (invoiceDate) {
      const offsetDays = parseInt(user?.settings?.payment_terms) || 30;
      const d = new Date(invoiceDate);
      d.setDate(d.getDate() + offsetDays);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [invoiceDate, user?.settings?.payment_terms]);

  // Validation States
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [touchedItems, setTouchedItems] = useState([
    { description: false, quantity: false, unit_price: false }
  ]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    setErrors(validateInvoice(invoiceDate, dueDate, taxRate, items));
  }, [invoiceDate, dueDate, taxRate, items]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await api.get('/clients');
      if (response.data.success) {
        setClients(response.data.clients);
        if (response.data.clients.length > 0) {
          setClientId(response.data.clients[0].id.toString());
        }
      } else {
        setError('Failed to fetch client list.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend.');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0.00 }]);
    setTouchedItems(prev => [...prev, { description: false, quantity: false, unit_price: false }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
    setTouchedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleItemBlur = (index, field) => {
    setTouchedItems(prev => {
      const updated = [...prev];
      if (!updated[index]) {
        updated[index] = {};
      }
      updated[index][field] = true;
      return updated;
    });
  };

  // Math Calculations
  const calculateTotals = () => {
    const subtotal = items.reduce((acc, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unit_price) || 0;
      return acc + (q * p);
    }, 0);
    const taxAmount = subtotal * ((parseFloat(taxRate) || 0) / 100);
    const grandTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, grandTotal };
  };

  const { subtotal, taxAmount, grandTotal } = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrs = validateInvoice(invoiceDate, dueDate, taxRate, items);
    if (Object.keys(validationErrs).length > 0) {
      setErrors(validationErrs);
      setTouched({ invoiceDate: true, dueDate: true, taxRate: true });
      setTouchedItems(items.map(() => ({ description: true, quantity: true, unit_price: true })));
      setError('Please fix the validation errors.');
      toast.error('Please fix the validation errors.');
      return;
    }

    if (!clientId) {
      setError('Please select a client.');
      toast.error('Please select a client.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/invoices', {
        client_id: parseInt(clientId),
        invoice_date: invoiceDate,
        due_date: dueDate,
        tax_rate: parseFloat(taxRate),
        items: items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        })),
        status: status
      });

      if (response.data.success) {
        toast.success(status === 'Draft' ? 'Invoice saved as draft' : 'Invoice created successfully');
        navigate(`/invoices/${response.data.invoice_id}`);
      } else {
        const msg = response.data.message || 'Failed to create invoice.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.message || 'Error occurred while saving invoice.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getInputClass = (fieldName, baseClass) => {
    if (!touched[fieldName]) {
      return `${baseClass} focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500`;
    }
    if (errors[fieldName]) {
      return `${baseClass} border-rose-500 dark:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500`;
    }
    return `${baseClass} border-emerald-500 dark:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`;
  };

  const getItemInputClass = (index, field, baseClass) => {
    const isTouched = touchedItems[index]?.[field];
    const hasError = errors.items?.[index]?.[field];
    if (!isTouched) {
      return `${baseClass} focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500`;
    }
    if (hasError) {
      return `${baseClass} border-rose-500 dark:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500`;
    }
    return `${baseClass} border-emerald-500 dark:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`;
  };

  const isFormValid = Object.keys(errors).length === 0;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/invoices" className="p-2 card hover:shadow-card-md transition-shadow text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create New Invoice</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Generate a billing template for a business client.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {loadingClients ? (
        <div className="card p-12 text-center">
          <span className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin inline-block" />
        </div>
      ) : clients.length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">No clients available</h3>
          <p className="text-slate-400 text-sm mt-1 mb-4">You must create a client profile before issuing an invoice.</p>
          <Link to="/clients" className="btn-primary mx-auto text-sm">Create First Client</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Invoice Card */}
          <div className="card p-6 space-y-6">
            
            {/* Upper Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Select Client */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Bill To *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="block w-full py-2.5 px-3.5 border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.client_name} ({c.email})</option>
                  ))}
                </select>
              </div>

              {/* Invoice Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice Date *</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    onBlur={() => handleBlur('invoiceDate')}
                    className={getInputClass('invoiceDate', "block w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl text-slate-850 dark:text-white sm:text-sm")}
                  />
                </div>
                {touched.invoiceDate && errors.invoiceDate && (
                  <p className="mt-1 text-xs text-rose-500">{errors.invoiceDate}</p>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date *</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onBlur={() => handleBlur('dueDate')}
                    className={getInputClass('dueDate', "block w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl text-slate-850 dark:text-white sm:text-sm")}
                  />
                </div>
                {touched.dueDate && errors.dueDate && (
                  <p className="mt-1 text-xs text-rose-500">{errors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Line Items</h3>
                <span className="text-xs text-slate-400">Add materials, services or hours</span>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col md:flex-row items-center gap-3 bg-slate-50/50 dark:bg-slate-800/20 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40"
                  >
                    {/* Item Description */}
                    <div className="w-full md:flex-1">
                      <input
                        type="text"
                        placeholder="Description of service/product..."
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        onBlur={() => handleItemBlur(index, 'description')}
                        className={getItemInputClass(index, 'description', "block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 sm:text-sm")}
                      />
                      {touchedItems[index]?.description && errors.items?.[index]?.description && (
                        <p className="mt-1 text-[10px] text-rose-500">{errors.items[index].description}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-full md:w-28">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Qty"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        onBlur={() => handleItemBlur(index, 'quantity')}
                        className={getItemInputClass(index, 'quantity', "block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 sm:text-sm text-center font-semibold")}
                      />
                      {touchedItems[index]?.quantity && errors.items?.[index]?.quantity && (
                        <p className="mt-1 text-[10px] text-rose-500 text-center">{errors.items[index].quantity}</p>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div className="w-full md:w-36">
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <span className="text-slate-400 sm:text-sm font-semibold">{getCurrencySymbol(user?.settings?.default_currency)}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Price"
                          required
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          onBlur={() => handleItemBlur(index, 'unit_price')}
                          className={getItemInputClass(index, 'unit_price', "block w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 sm:text-sm font-semibold text-right")}
                        />
                      </div>
                      {touchedItems[index]?.unit_price && errors.items?.[index]?.unit_price && (
                        <p className="mt-1 text-[10px] text-rose-500 text-right">{errors.items[index].unit_price}</p>
                      )}
                    </div>

                    {/* Line Total Display */}
                    <div className="w-full md:w-28 text-right font-bold text-slate-800 dark:text-slate-200 px-2 py-2 md:py-0 border-t md:border-t-0 border-slate-100">
                      {formatCurrency(((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)), user?.settings?.default_currency)}
                    </div>

                    {/* Delete Line */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                      className="p-2 rounded-lg text-slate-450 hover:text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors disabled:opacity-40 shrink-0"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add item triggers */}
              <button
                type="button"
                onClick={handleAddItem}
                className="mt-2 flex items-center space-x-1 px-4 py-2 border border-dashed border-slate-300 dark:border-slate-800 text-brand-600 dark:text-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-950/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            {/* Calculations layout and tax and Status */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              
              {/* Left hand status and tax parameters */}
              <div className="space-y-4 w-full md:w-72">
                <div className="grid grid-cols-1 gap-4">
                  {/* Tax Rate setting */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tax Rate (%)</label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        onBlur={() => handleBlur('taxRate')}
                        className={getInputClass('taxRate', "block w-full pr-8 pl-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl text-slate-800 dark:text-white sm:text-sm text-right font-semibold")}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <Percent className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                    {touched.taxRate && errors.taxRate && (
                      <p className="mt-1 text-xs text-rose-500 text-right">{errors.taxRate}</p>
                    )}
                  </div>

                  {/* Save Mode status */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Mode</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="block w-full py-2 px-3 border border-slate-205 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-808 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm"
                    >
                      <option value="Pending">Publish immediately (Pending)</option>
                      <option value="Draft">Save as Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right hand Subtotal, tax, grand total blocks */}
              <div className="w-full md:w-80 space-y-2.5 text-sm">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(subtotal, user?.settings?.default_currency)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Tax Amount ({taxRate}%):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(taxAmount, user?.settings?.default_currency)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                  <span className="text-slate-850 dark:text-white">Grand Total:</span>
                  <span className="text-brand-600 dark:text-brand-400 text-xl">{formatCurrency(grandTotal, user?.settings?.default_currency)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" disabled={submitting}
              onClick={() => !submitting && navigate('/invoices')}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button type="submit" disabled={!isFormValid || submitting}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
              <Save className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Save & Close'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InvoiceCreate;
