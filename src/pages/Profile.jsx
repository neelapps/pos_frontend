import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Key, Save, RefreshCw } from 'lucide-react';
import API from '../services/api.js';
import { updateUserSuccess } from '../store/slices/authSlice.js';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get('/auth/profile');
      setForm({
        name: data.name,
        email: data.email,
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
      };
      if (form.password) {
        payload.password = form.password;
      }

      const { data } = await API.put('/auth/profile', payload);
      dispatch(updateUserSuccess({ name: data.name, email: data.email }));
      alert('Profile updated successfully!');
      setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setLoading(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Update failed');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          <User className="text-brand-500" />
          My Profile Details
        </h2>
        <p className="text-sm text-slate-500 mt-1">Manage your login details and change account passwords.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-505">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-505">System Role Privilege</label>
              <input
                type="text"
                disabled
                value={user?.role || ''}
                className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-sm font-semibold cursor-not-allowed text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-505">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <Key size={16} /> Change Password (Leave blank to keep current)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-505">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-505">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 text-white hover:bg-brand-700 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm mt-4 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} Save Profile Changes
          </button>
        </form>
      </div>

    </div>
  );
};

export default Profile;
