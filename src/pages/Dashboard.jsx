import React, { useState, useEffect } from 'react';
import { ShoppingBag, TrendingUp, AlertTriangle, Grid } from 'lucide-react';
import API from '../services/api.js';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrderCount: 0,
    lowStockCount: 0,
    occupiedTablesCount: 0,
    recentOrders: [],
    unreadNotifications: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/reports/dashboard');
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll stats every 15 seconds
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      title: "Today's Revenue",
      value: `Rs. ${stats.todayRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20'
    },
    {
      title: "Today's Orders",
      value: stats.todayOrderCount,
      icon: ShoppingBag,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20'
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20'
    },
    {
      title: 'Occupied Tables',
      value: stats.occupiedTablesCount,
      icon: Grid,
      color: 'bg-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/20'
    }
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome message */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
          Dashboard Overview
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here is a quick snapshot of what is happening today in the restaurant
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className={`rounded-xl p-3 ${card.bgColor} ${card.textColor}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</p>
                <p className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            Recent Orders
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800 font-semibold">
                  <th className="pb-3">Order No.</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Table</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-slate-500">
                      No active orders placed today
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((ord) => (
                    <tr key={ord.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3.5 font-medium text-slate-800 dark:text-white">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5">{ord.type}</td>
                      <td className="py-3.5">{ord.table?.tableNumber || '-'}</td>
                      <td className="py-3.5 font-semibold text-slate-800 dark:text-white">
                        Rs. {parseFloat(ord.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ord.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : ord.status === 'Cancelled'
                              ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Warnings/Activity feed */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            Active Alerts
          </h3>
          <div className="space-y-4">
            {stats.unreadNotifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No new inventory or system alerts
              </div>
            ) : (
              stats.unreadNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex gap-3 rounded-lg border border-slate-100 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30"
                >
                  <span className="text-xl">
                    {notif.type === 'Inventory' ? '⚠️' : '🔔'}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {notif.type} alert
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
