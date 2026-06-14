import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to continue?", 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  isDanger = true,
  isLoading = false,
  loadingText = "Processing..."
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-fade-in space-y-4 flex flex-col">
        <div className="flex items-center space-x-3 text-amber-500">
          <AlertTriangle className="w-8 h-8 shrink-0" />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {message}
        </p>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-200 dark:border-slate-750 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-75 ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            <span>{isLoading ? loadingText : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
