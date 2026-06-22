import React, { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import API from '../services/api.js';
import { AlertTriangle, Trash2 } from 'lucide-react';

const CancelItemModal = ({ isOpen, onClose, orderId, item, onSuccess }) => {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('Customer Changed Mind');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const remainingQty = item ? item.quantity - (item.cancelledQuantity || 0) : 0;

  useEffect(() => {
    if (item) {
      setQty(remainingQty);
      setReason('Customer Changed Mind');
      setCustomReason('');
    }
  }, [item, remainingQty]);

  if (!item) return null;

  const quickReasons = [
    'Customer Changed Mind',
    'Wrong Order Entry',
    'Delayed Kitchen Service',
    'Quality Issues',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const finalQty = parseInt(qty);
    if (isNaN(finalQty) || finalQty <= 0 || finalQty > remainingQty) {
      alert(`Invalid quantity. Must be between 1 and ${remainingQty}.`);
      return;
    }

    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      alert('Please specify a cancellation reason.');
      return;
    }

    setLoading(true);
    try {
      await API.post(`/pos/orders/${orderId}/items/${item.id}/cancel`, {
        cancelledQuantity: finalQty,
        cancelReason: finalReason
      });
      alert('Item cancelled successfully.');
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel Item - ${item.menuItem?.name}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-xl text-rose-800 dark:text-rose-400">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <div className="text-xs space-y-1">
            <p className="font-bold">Are you sure you want to cancel this item?</p>
            <p>This action will adjust the active quantity, recalculate bill totals, and update the kitchen ticket.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Cancellation Quantity (Max {remainingQty})
          </label>
          <input
            type="number"
            min="1"
            max={remainingQty}
            required
            value={qty}
            onChange={(e) => setQty(Math.min(remainingQty, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-805 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2">
            Cancellation Reason
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {quickReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  reason === r
                    ? 'bg-rose-50 border-rose-250 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-450'
                    : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {reason === 'Other' && (
            <textarea
              placeholder="Enter custom cancellation reason..."
              required
              rows="3"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-805 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-white text-sm"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg transition-all"
        >
          <Trash2 size={16} />
          {loading ? 'Processing...' : 'Confirm Cancellation'}
        </button>
      </form>
    </Modal>
  );
};

export default CancelItemModal;
