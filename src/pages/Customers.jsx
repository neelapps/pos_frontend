import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, RefreshCw, Loader2 } from 'lucide-react';
import API from '../services/api.js';
import Modal from '../components/Modal.jsx';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Modal status
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const fetchCustomers = async () => {
    try {
      const { data } = await API.get('/pos/customers');
      setCustomers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAdd = () => {
    setForm({ name: '', phone: '', email: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;

    setIsSubmitting(true);
    try {
      await API.post('/pos/customers', form);
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Customer Loyalty Cards</h2>
          <p className="text-sm text-slate-500 mt-1">Manage loyal customer accounts and loyalty points ledger.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAdd}
            className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus size={16} /> Register Customer
          </button>
          <button
            onClick={fetchCustomers}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by customer phone or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-transparent focus:outline-none text-sm"
        />
      </div>

      {/* Table grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center py-10">Fetching customer accounts...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Customer ID</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Accumulated Points</th>
                <th className="pb-3">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">
                    No matching customer records found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 font-semibold text-slate-500">#LOY-{c.id}</td>
                    <td className="py-3.5 font-bold text-slate-850 dark:text-white">{c.name}</td>
                    <td className="py-3.5">{c.phone}</td>
                    <td className="py-3.5">{c.email || 'No email saved'}</td>
                    <td className="py-3.5">
                      <span className="bg-emerald-50 text-emerald-700 font-extrabold text-xs px-2.5 py-1 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">
                        {c.points} Points
                      </span>
                    </td>
                    <td className="py-3.5">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Customer Register Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register Customer Account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Phone Number (10 digit)</label>
            <input
              type="text"
              required
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="e.g. john@doe.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
            <span>Register Account</span>
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Customers;
