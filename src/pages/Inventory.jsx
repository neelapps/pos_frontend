import React, { useState, useEffect } from 'react';
import { Plus, Warehouse, RefreshCw, AlertTriangle, Scale, Edit2 } from 'lucide-react';
import API from '../services/api.js';
import Modal from '../components/Modal.jsx';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('stock'); // stock or suppliers
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stock Adjust Modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTargetItem, setAdjustTargetItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', type: 'IN' });

  // Add/Edit Inventory Item Modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    category: '',
    currentStock: 0.0,
    unit: 'kg',
    minStockAlert: 10.0,
    supplierId: ''
  });

  // Supplier Form Modal state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const invRes = await API.get('/inventory');
      setInventory(invRes.data);

      const supRes = await API.get('/inventory/suppliers');
      setSuppliers(supRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Stock In / Out Adjustment
  const handleOpenAdjust = (item) => {
    setAdjustTargetItem(item);
    setAdjustForm({ quantity: '', type: 'IN' });
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.quantity || !adjustTargetItem) return;

    try {
      await API.post(`/inventory/${adjustTargetItem.id}/adjust`, adjustForm);
      setShowAdjustModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Adjust failed');
    }
  };

  // Add Item
  const handleOpenAddItem = () => {
    setEditItem(null);
    setItemForm({
      name: '',
      sku: 'RAW-' + Date.now().toString().slice(-6),
      category: 'Dairy',
      currentStock: 0.0,
      unit: 'kg',
      minStockAlert: 10.0,
      supplierId: suppliers[0]?.id || ''
    });
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await API.put(`/inventory/${editItem.id}`, itemForm);
      } else {
        await API.post('/inventory', itemForm);
      }
      setShowItemModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  // Supplier Add
  const handleOpenAddSupplier = () => {
    setEditSupplier(null);
    setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '' });
    setShowSupplierModal(true);
  };

  const handleOpenEditSupplier = (supplier) => {
    setEditSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || ''
    });
    setShowSupplierModal(true);
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSupplier) {
        await API.put(`/inventory/suppliers/${editSupplier.id}`, supplierForm);
      } else {
        await API.post('/inventory/suppliers', supplierForm);
      }
      setShowSupplierModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Supplier save failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
            <Warehouse className="text-brand-500" />
            Raw Stock & Inventory
          </h2>
          <p className="text-sm text-slate-500 mt-1">Track ingredient levels, create supplier logs, and adjust stock in/out.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'stock' ? (
            <button
              onClick={handleOpenAddItem}
              className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Ingredient
            </button>
          ) : (
            <button
              onClick={handleOpenAddSupplier}
              className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Supplier
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'stock'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Ingredients Stock ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'suppliers'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Suppliers ({suppliers.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Fetching inventory details...</div>
      ) : activeTab === 'stock' ? (
        /* Ingredients grid view */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">SKU</th>
                <th className="pb-3">Item Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Current Stock</th>
                <th className="pb-3">Min Alert Level</th>
                <th className="pb-3">Supplier</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {inventory.map((item) => {
                const isLow = parseFloat(item.currentStock) <= parseFloat(item.minStockAlert);
                return (
                  <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 font-semibold text-slate-500">{item.sku}</td>
                    <td className="py-3.5 font-bold text-slate-850 dark:text-white">{item.name}</td>
                    <td className="py-3.5">{item.category || '-'}</td>
                    <td className="py-3.5 font-extrabold text-slate-800 dark:text-white">
                      {parseFloat(item.currentStock).toFixed(2)} {item.unit}
                    </td>
                    <td className="py-3.5">
                      {parseFloat(item.minStockAlert).toFixed(2)} {item.unit}
                    </td>
                    <td className="py-3.5">{item.supplier?.name || '-'}</td>
                    <td className="py-3.5">
                      {isLow ? (
                        <span className="flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 w-fit">
                          <AlertTriangle size={10} /> Low Stock
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full dark:bg-emerald-950/20 dark:text-emerald-450 w-fit">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 px-2 py-1 rounded-lg text-xs font-semibold"
                        >
                          <Scale size={12} /> Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Suppliers view */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Supplier Name</th>
                <th className="pb-3">Contact Person</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Address</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {suppliers.map((sup) => (
                <tr key={sup.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 font-bold text-slate-850 dark:text-white">{sup.name}</td>
                  <td className="py-3.5">{sup.contactPerson || '-'}</td>
                  <td className="py-3.5">{sup.phone}</td>
                  <td className="py-3.5">{sup.email || '-'}</td>
                  <td className="py-3.5">{sup.address || '-'}</td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleOpenEditSupplier(sup)}
                      className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 dark:border-slate-800"
                    >
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Adjust Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title={`Adjust Stock: ${adjustTargetItem?.name}`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl dark:bg-slate-950 flex justify-between text-sm">
            <span>Current Balance:</span>
            <span className="font-bold text-slate-850 dark:text-white">
              {adjustTargetItem?.currentStock} {adjustTargetItem?.unit}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Adjustment Action</label>
              <select
                value={adjustForm.type}
                onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
              >
                <option value="IN">STOCK IN (Add Stock)</option>
                <option value="OUT">STOCK OUT (Consume Stock)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Quantity ({adjustTargetItem?.unit})</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 5.5"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2"
          >
            Submit Adjustment
          </button>
        </form>
      </Modal>

      {/* Ingredient Add/Edit Modal */}
      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title="Add Raw Stock Ingredient">
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Ingredient Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Fresh Paneer"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">SKU Code</label>
              <input
                type="text"
                required
                value={itemForm.sku}
                onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Initial Stock</label>
              <input
                type="number"
                step="0.1"
                required
                value={itemForm.currentStock}
                onChange={(e) => setItemForm({ ...itemForm, currentStock: parseFloat(e.target.value) })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Unit (kg/ltrs/pcs)</label>
              <input
                type="text"
                required
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Min Alert Limit</label>
              <input
                type="number"
                step="0.1"
                required
                value={itemForm.minStockAlert}
                onChange={(e) => setItemForm({ ...itemForm, minStockAlert: parseFloat(e.target.value) })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Category Tag</label>
              <input
                type="text"
                placeholder="e.g. Dairy"
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Assigned Supplier</label>
              <select
                value={itemForm.supplierId}
                onChange={(e) => setItemForm({ ...itemForm, supplierId: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
              >
                <option value="">Choose Supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2"
          >
            Save Ingredient
          </button>
        </form>
      </Modal>

      {/* Supplier Modal */}
      <Modal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} title={editSupplier ? 'Edit Supplier' : 'Register Supplier'}>
        <form onSubmit={handleSupplierSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Supplier Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Mother Dairy Pvt Ltd"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Mr. Robert"
                value={supplierForm.contactPerson}
                onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Phone</label>
              <input
                type="text"
                required
                placeholder="e.g. +91 9988776655"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Email</label>
              <input
                type="email"
                placeholder="e.g. robert@metro.com"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Office Address</label>
            <textarea
              placeholder="Provide supplier location details..."
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2"
          >
            Save Supplier Profile
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
