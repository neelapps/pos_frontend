import React, { useState, useEffect } from 'react';
import { Plus, IndianRupee, RefreshCw, Trash } from 'lucide-react';
import API from '../services/api.js';
import Modal from '../components/Modal.jsx';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add expense modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ amount: '', category: 'Rent', description: '', date: new Date().toISOString().split('T')[0] });

  const fetchExpenses = async () => {
    try {
      const { data } = await API.get('/reports/expenses');
      setExpenses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenAdd = () => {
    setForm({ amount: '', category: 'Rent', description: '', date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category) return;

    try {
      await API.post('/reports/expenses', form);
      setShowModal(false);
      fetchExpenses();
    } catch (error) {
      alert('Failed to log expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense entry?')) return;
    try {
      await API.delete(`/reports/expenses/${id}`);
      fetchExpenses();
    } catch (error) {
      alert('Failed to delete entry');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
            <IndianRupee className="text-brand-500" />
            Operational Expenses
          </h2>
          <p className="text-sm text-slate-500 mt-1">Track payouts, utility bills, raw supply costs, and staff salaries.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAdd}
            className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus size={16} /> Log Expense
          </button>
          <button
            onClick={fetchExpenses}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center py-10">Fetching expense items...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Date</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500">
                    No expense payouts logged this month.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="py-3.5">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5">{exp.description || 'No description provided.'}</td>
                    <td className="py-3.5 font-extrabold text-slate-850 dark:text-white">
                      Rs. {parseFloat(exp.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-950/20"
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

      {/* Log Expense Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Operational Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Expense Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
              >
                <option value="Rent">Rent & Leasing</option>
                <option value="Utilities">Electricity & Water</option>
                <option value="Wages">Staff Salary Wages</option>
                <option value="Ingredients">Raw Ingredients Restock</option>
                <option value="Marketing">Advertisements & Promo</option>
                <option value="Other">Miscellaneous Expenses</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Amount Paid (Rs.)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 1500"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Payout Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Description details</label>
            <textarea
              required
              placeholder="Provide exact expense details (e.g. Paid monthly lease or bought 50kg flour)..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2"
          >
            Submit Expense Entry
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Expenses;
