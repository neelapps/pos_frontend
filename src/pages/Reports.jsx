import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Activity, Receipt, RefreshCw, BarChart2 } from 'lucide-react';
import API from '../services/api.js';

const Reports = () => {
  const [salesStats, setSalesStats] = useState({
    totalSalesAmount: 0,
    ordersCount: 0,
    averageBillValue: 0,
    paymentMethodSplit: [],
    popularItems: [],
    salesByCategory: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/reports/sales');
      setSalesStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading reports:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  // Find max value in Category Sales to draw responsive charts
  const maxCategorySales = Math.max(
    ...salesStats.salesByCategory.map((c) => parseFloat(c.totalSales) || 1),
    1
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Reports & Sales Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">Deep-dive visual logs of restaurant turnovers and items velocity.</p>
        </div>
        <button
          onClick={fetchReports}
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl p-3 bg-brand-50 text-brand-650 dark:bg-brand-950/20 dark:text-brand-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Sales Turnover</p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
              Rs. {parseFloat(salesStats.totalSalesAmount || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl p-3 bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Invoices</p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
              {salesStats.ordersCount} Bills
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl p-3 bg-emerald-50 text-emerald-650 dark:bg-emerald-950/20 dark:text-emerald-400">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Bill Value</p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
              Rs. {parseFloat(salesStats.averageBillValue || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Category (Visual SVG Bar graphs) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-extrabold text-slate-850 dark:text-white mb-6 flex items-center gap-1.5">
            <BarChart2 size={18} className="text-brand-500" /> Sales Share by Category
          </h3>
          <div className="space-y-4">
            {salesStats.salesByCategory.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400">No category sales recorded.</div>
            ) : (
              salesStats.salesByCategory.map((c) => {
                const percentage = ((parseFloat(c.totalSales) / maxCategorySales) * 100).toFixed(0);
                return (
                  <div key={c.categoryId} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-350">{c['category.name'] || 'General'}</span>
                      <span className="text-slate-850 dark:text-white">Rs. {parseFloat(c.totalSales).toFixed(2)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Popular Dish Velocities */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-extrabold text-slate-850 dark:text-white mb-6 flex items-center gap-1.5">
            <Award size={18} className="text-brand-500" /> Top Selling Dishes
          </h3>
          <div className="space-y-3.5">
            {salesStats.popularItems.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400">No dish sales recorded.</div>
            ) : (
              salesStats.popularItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
                  <div>
                    <span className="text-xs text-brand-650 font-bold">Rank #{idx + 1}</span>
                    <h4 className="font-bold text-sm text-slate-850 dark:text-white mt-0.5">
                      {item['menuItem.name']}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-slate-850 dark:text-white">
                      {item.totalQty} Units
                    </span>
                    <p className="text-[10px] text-slate-400">Sold across orders</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment methods splits breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 max-w-md">
        <h3 className="text-base font-extrabold text-slate-850 dark:text-white mb-4">Payment Methods Split</h3>
        <div className="space-y-3">
          {salesStats.paymentMethodSplit.length === 0 ? (
            <div className="text-center py-4 text-sm text-slate-400">No transaction settlement records.</div>
          ) : (
            salesStats.paymentMethodSplit.map((pay) => (
              <div key={pay.paymentMethod} className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-800/50 pb-2.5">
                <span className="font-bold text-slate-650 dark:text-slate-350">{pay.paymentMethod}</span>
                <div className="text-right">
                  <span className="font-extrabold text-slate-850 dark:text-white">
                    Rs. {parseFloat(pay.totalPaid).toFixed(2)}
                  </span>
                  <p className="text-[10px] text-slate-405">({pay.count} checkouts)</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Reports;
