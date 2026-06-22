import React, { useState, useEffect } from 'react';
import { Plus, Ticket, RefreshCw, Trash } from 'lucide-react';
import API from '../services/api.js';
import Modal from '../components/Modal.jsx';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Coupon modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 'Percentage',
    discountValue: '',
    minOrderAmount: '',
    isActive: true
  });

  const fetchCoupons = async () => {
    try {
      const { data } = await API.get('/pos/coupons');
      setCoupons(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenAdd = () => {
    setForm({ code: '', discountType: 'Percentage', discountValue: '', minOrderAmount: '', isActive: true });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue || !form.minOrderAmount) return;

    try {
      await API.post('/pos/coupons', form);
      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon code?')) return;
    try {
      await API.delete(`/pos/coupons/${id}`);
      fetchCoupons();
    } catch (error) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
            <Ticket className="text-brand-500" />
            Promo Coupons & Discounts
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure discount codes, percentages, and minimum cart amounts.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAdd}
            className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus size={16} /> Create Coupon
          </button>
          <button
            onClick={fetchCoupons}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Coupons grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center py-10">Fetching discount records...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Coupon Code</th>
                <th className="pb-3">Discount Type</th>
                <th className="pb-3">Discount Value</th>
                <th className="pb-3">Min Order Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">
                    No active discount coupons defined.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 font-bold text-brand-600 dark:text-brand-400">{c.code}</td>
                    <td className="py-3.5">{c.discountType}</td>
                    <td className="py-3.5 font-bold">
                      {c.discountType === 'Percentage' ? `${parseFloat(c.discountValue)}%` : `Rs. ${parseFloat(c.discountValue).toFixed(2)}`}
                    </td>
                    <td className="py-3.5">Rs. {parseFloat(c.minOrderAmount).toFixed(2)}</td>
                    <td className="py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Log Coupon Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Discount Coupon">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">Promo Code (Uppercase)</label>
            <input
              type="text"
              required
              placeholder="e.g. WELCOME50"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Discount Channel</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
              >
                <option value="Percentage">Percentage Off (%)</option>
                <option value="Fixed">Fixed Amount Off (Rs.)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-505">Discount Value</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 10"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-505">Minimum Order Amount (Rs.)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 500"
              value={form.minOrderAmount}
              onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={() => setForm({ ...form, isActive: !form.isActive })}
                className="h-4 w-4 rounded text-brand-600 border-slate-350"
              />
              Activate Promo Coupon Code
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2"
          >
            Save Promo Coupon
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Coupons;
