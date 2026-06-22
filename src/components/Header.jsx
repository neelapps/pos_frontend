import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User, LogOut, Menu } from 'lucide-react';
import { logout } from '../store/slices/authSlice.js';
import API from '../services/api.js';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/reports/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
    if (!showNotifications) {
      try {
        await API.post('/reports/notifications/read-all');
        // Reset unread counts locally
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 lg:hidden"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white lg:text-xl">
          {user?.restaurant?.name || 'POS & Billing System'}
        </h1>
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        {/* Dark/Light mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleNotificationClick}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-2 font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                Notifications
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-2 text-sm border-b border-slate-50 dark:border-slate-800 last:border-b-0 ${
                        !n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-200">{n.type} Alert</div>
                      <div className="text-slate-600 dark:text-slate-400">{n.message}</div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 md:block">
              {user?.name}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <User size={16} /> My Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
