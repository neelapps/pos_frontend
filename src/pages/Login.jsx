import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice.js';
import API from '../services/api.js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect path after logging in
  const from = location.state?.from?.pathname || '/pos';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(loginStart());
    try {
      const { data } = await API.post('/auth/login', { email, password });
      dispatch(loginSuccess(data));
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      dispatch(loginFailure(msg));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
        
        {/* App Title */}
        <div className="mb-8 text-center">
          <span className="text-4xl">🍳</span>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-800 dark:text-white">
            Welcome to Sonket POS
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in to manage your restaurant billing & kitchen
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. admin@restaurant.com"
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-500"
            />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        {/* Guest credentials helper */}
        <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400">Demo Login Accounts:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Admin: <strong className="dark:text-slate-300">admin@restaurant.com</strong></span>
            <span>/ Password: <strong className="dark:text-slate-300">admin123</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
