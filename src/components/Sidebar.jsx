import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Utensils,
  CookingPot,
  Receipt,
  Grid,
  Users,
  Warehouse,
  IndianRupee,
  Ticket,
  UserCheck,
  TrendingUp,
  Settings,
  X,
  LogOut
} from 'lucide-react';
import { logout } from '../store/slices/authSlice.js';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    {
      title: 'POS Billing',
      path: '/pos',
      icon: Utensils,
      roles: ['Admin', 'Manager', 'Cashier'],
    },
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Manager', 'Cashier'],
    },
    {
      title: 'KOT Management',
      path: '/kot',
      icon: CookingPot,
      roles: ['Admin', 'Manager', 'Kitchen'],
    },
    {
      title: 'Orders',
      path: '/orders',
      icon: Receipt,
      roles: ['Admin', 'Manager', 'Cashier'],
    },
    {
      title: 'Table Status',
      path: '/tables',
      icon: Grid,
      roles: ['Admin', 'Manager', 'Cashier'],
    },
    {
      title: 'Menu Items',
      path: '/menu',
      icon: Utensils,
      roles: ['Admin', 'Manager'],
    },
    {
      title: 'Customers',
      path: '/customers',
      icon: Users,
      roles: ['Admin', 'Manager', 'Cashier'],
    },
    {
      title: 'Inventory',
      path: '/inventory',
      icon: Warehouse,
      roles: ['Admin', 'Manager'],
    },
    {
      title: 'Expenses',
      path: '/expenses',
      icon: IndianRupee,
      roles: ['Admin', 'Manager'],
    },
    {
      title: 'Coupons',
      path: '/coupons',
      icon: Ticket,
      roles: ['Admin', 'Manager'],
    },
    {
      title: 'Staff Management',
      path: '/staff',
      icon: UserCheck,
      roles: ['Admin', 'Manager'],
    },
    {
      title: 'Reports & Stats',
      path: '/reports',
      icon: TrendingUp,
      roles: ['Admin', 'Manager'],
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['Admin'],
    },
  ];

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed bottom-0 top-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400">
              Sonket POS
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-thin">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                  }`
                }
              >
                <Icon size={18} />
                {item.title}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
