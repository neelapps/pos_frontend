import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, RefreshCw, Trash } from 'lucide-react';
import API from '../services/api.js';
import Modal from '../components/Modal.jsx';

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Staff modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Cashier', phone: '', status: true });

  const fetchStaff = async () => {
    try {
      const { data } = await API.get('/auth/staff');
      setStaffList(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenAdd = () => {
    setForm({ name: '', email: '', password: '', role: 'Cashier', phone: '', status: true });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;

    try {
      await API.post('/auth/register', form);
      setShowModal(false);
      fetchStaff();
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff profile account?')) return;
    try {
      await API.delete(`/auth/staff/${id}`);
      fetchStaff();
    } catch (error) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
            <UserCheck className="text-brand-500" />
            Staff & Roles Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure cashier credentials, waiter records, and kitchen handlers.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAdd}
            className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Staff Account
          </button>
          <button
            onClick={fetchStaff}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Staff directory table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center py-10">Fetching employee log...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Role Privilege</th>
                <th className="pb-3">Account Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {staffList.map((st) => (
                <tr key={st.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 font-bold text-slate-850 dark:text-white">{st.name}</td>
                  <td className="py-3.5">{st.email}</td>
                  <td className="py-3.5">{st.phone || '-'}</td>
                  <td className="py-3.5">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {st.role}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        st.status
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {st.status ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(st.id)}
                      className="p-1 text-red-500 hover:text-red-650 hover:bg-red-50 rounded"
                    >
                      <Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Staff Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register Staff User Profile">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-505">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Robin Hood"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-505">Privilege Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
              >
                <option value="Admin">Admin (Full Control)</option>
                <option value="Manager">Manager (Operations)</option>
                <option value="Cashier">Cashier (POS Checkout)</option>
                <option value="Kitchen">Kitchen (KOT preparation)</option>
                <option value="Waiter">Waiter (Dining Service)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-550">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. robin@grill.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-550">Secret Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-550">Contact phone</label>
            <input
              type="text"
              placeholder="e.g. +91 9988776655"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={form.status}
                onChange={() => setForm({ ...form, status: !form.status })}
                className="h-4 w-4 rounded text-brand-600 border-slate-350"
              />
              Enable Account Access Immediately
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2"
          >
            Register Employee Account
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Staff;
