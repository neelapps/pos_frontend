import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const now = new Date();
  const subscriptionEnd = user?.restaurant?.subscriptionEnd;
  const subscriptionStatus = user?.restaurant?.subscriptionStatus;
  const isExpired = subscriptionStatus === 'expired' || (subscriptionEnd && new Date(subscriptionEnd) < now);

  let isExpiringSoon = false;
  let daysRemaining = 0;
  if (!isExpired && subscriptionEnd) {
    const endDate = new Date(subscriptionEnd);
    const msDiff = endDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    if (daysRemaining >= 0 && daysRemaining <= 7) {
      isExpiringSoon = true;
    }
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans ${isExpired ? 'subscription-expired' : ''}`}>
      {/* Sidebar navigation */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main app panel */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        {/* Header toolbar */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Subscription Expired Warning Banner */}
        {isExpired && (
          <div className="bg-rose-50 border-b border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 px-4 py-3 text-rose-800 dark:text-rose-300 flex items-center gap-3 text-sm font-semibold select-none">
            <AlertTriangle className="text-rose-500 animate-pulse shrink-0" size={18} />
            <div className="flex-1">
              Subscription has expired. You currently have <span className="underline">View-Only</span> access. Business modifications are disabled.
            </div>
            {user?.role === 'Admin' && (
              <a href="/settings" className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-3 rounded shadow transition-colors shrink-0">
                Manage Subscription
              </a>
            )}
          </div>
        )}

        {/* Subscription Expiring Soon Warning Banner */}
        {!isExpired && isExpiringSoon && (
          <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 px-4 py-3 text-amber-800 dark:text-amber-300 flex items-center gap-3 text-sm font-semibold select-none">
            <AlertTriangle className="text-amber-500 shrink-0" size={18} />
            <div className="flex-1">
              Subscription is expiring soon! Your subscription ends in <span className="underline">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span>. Please renew soon to avoid service interruption.
            </div>
            {user?.role === 'Admin' && (
              <a href="/settings" className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 px-3 rounded shadow transition-colors shrink-0">
                Renew Subscription
              </a>
            )}
          </div>
        )}

        {/* Scrollable routing content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
