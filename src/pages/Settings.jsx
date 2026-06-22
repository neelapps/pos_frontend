import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Settings as SettingsIcon, Save, Store, Printer, Sliders, CreditCard } from 'lucide-react';
import API from '../services/api.js';
import { updateUserSuccess } from '../store/slices/authSlice.js';

const Settings = () => {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('setting_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Sonket Cafe & Grill',
      email: 'contact@sonket.com',
      phone: '+91 9988776655',
      address: 'Sector-5, Wholesale Hub, City',
      gstin: '07AAAAA1111A1Z1'
    };
  });

  const [print, setPrint] = useState(() => {
    const saved = localStorage.getItem('setting_print');
    return saved ? JSON.parse(saved) : {
      width: '80mm',
      headerText: 'Sonket Cafe & Grill',
      footerText: '*** Thank You! Visit Again ***',
      showLogo: true
    };
  });

  const [system, setSystem] = useState(() => {
    const saved = localStorage.getItem('setting_system');
    return saved ? JSON.parse(saved) : {
      currency: 'Rs.',
      defaultTax: '5%',
      enableSound: true
    };
  });

  const [subscription, setSubscription] = useState({
    subscriptionEnd: '',
    subscriptionStatus: 'active',
    isExpired: false
  });
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const { data } = await API.get('/auth/subscription');
        setSubscription({
          subscriptionEnd: data.subscriptionEnd ? data.subscriptionEnd.split('T')[0] : '',
          subscriptionStatus: data.subscriptionStatus || 'active',
          isExpired: data.isExpired || false
        });
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };
    fetchSub();
  }, []);

  const handleSaveSubscription = async () => {
    setSubLoading(true);
    try {
      const { data } = await API.put('/auth/subscription', {
        subscriptionEnd: subscription.subscriptionEnd ? subscription.subscriptionEnd : null,
        subscriptionStatus: subscription.subscriptionStatus
      });
      setSubscription({
        subscriptionEnd: data.subscriptionEnd ? data.subscriptionEnd.split('T')[0] : '',
        subscriptionStatus: data.subscriptionStatus,
        isExpired: data.isExpired
      });
      
      // Update redux store & localStorage user.restaurant details
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        user.restaurant = {
          ...user.restaurant,
          subscriptionEnd: data.subscriptionEnd,
          subscriptionStatus: data.subscriptionStatus
        };
        dispatch(updateUserSuccess(user));
      }
      alert('Subscription details updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSubLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('setting_profile', JSON.stringify(profile));
    localStorage.setItem('setting_print', JSON.stringify(print));
    localStorage.setItem('setting_system', JSON.stringify(system));
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <SettingsIcon className="text-brand-500" />
            System Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure business profile details, receipt layouts, and preferences.</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-brand-600 text-white hover:bg-brand-700 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Restaurant Profile Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-base font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
            <Store size={18} className="text-brand-500" /> Restaurant Details
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Restaurant Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">GSTIN Tax Registration</label>
                <input
                  type="text"
                  value={profile.gstin}
                  onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-505">Office Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Invoice Thermal Layout */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-base font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-855 pb-3">
            <Printer size={18} className="text-brand-500" /> Receipt Formatting
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Paper Width (Default 80mm)</label>
              <select
                value={print.width}
                onChange={(e) => setPrint({ ...print, width: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
              >
                <option value="80mm">80mm Standard thermal</option>
                <option value="58mm">58mm Portable billing printer</option>
                <option value="A4">A4 Full sheet printer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Header Welcome Message</label>
              <input
                type="text"
                value={print.headerText}
                onChange={(e) => setPrint({ ...print, headerText: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-505">Footer Closing Message</label>
              <input
                type="text"
                value={print.footerText}
                onChange={(e) => setPrint({ ...print, footerText: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* System Settings & alerts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-base font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
            <Sliders size={18} className="text-brand-500" /> Preferences
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Base Currency Symbol</label>
                <input
                  type="text"
                  value={system.currency}
                  onChange={(e) => setSystem({ ...system, currency: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Default Service Tax (GST)</label>
                <input
                  type="text"
                  value={system.defaultTax}
                  onChange={(e) => setSystem({ ...system, defaultTax: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
                />
              </div>
            </div>
            <div className="pt-2">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={system.enableSound}
                  onChange={() => setSystem({ ...system, enableSound: !system.enableSound })}
                  className="h-4 w-4 rounded text-brand-600 border-slate-350"
                />
                Play audible alert chime on incoming KOT orders
              </label>
            </div>
          </div>
        </div>

        {/* Subscription Settings Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-base font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
            <CreditCard size={18} className="text-brand-500" /> Subscription Management
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Subscription Status</span>
                <span className={`text-sm font-extrabold ${subscription.isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {subscription.isExpired ? 'EXPIRED (View-Only)' : 'ACTIVE'}
                </span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${subscription.isExpired ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                {subscription.isExpired ? 'Expired' : 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Expiry Date</label>
                <input
                  type="date"
                  value={subscription.subscriptionEnd}
                  onChange={(e) => setSubscription({ ...subscription, subscriptionEnd: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Status Override</label>
                <select
                  value={subscription.subscriptionStatus}
                  onChange={(e) => setSubscription({ ...subscription, subscriptionStatus: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveSubscription}
                disabled={subLoading}
                className="w-full bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {subLoading ? 'Saving...' : 'Update Subscription'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
