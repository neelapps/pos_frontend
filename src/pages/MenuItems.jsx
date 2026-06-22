import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash, RefreshCw, Loader2 } from 'lucide-react';
import API from '../services/api.js';
import Modal from '../components/Modal.jsx';

const MenuItems = () => {
  const [activeTab, setActiveTab] = useState('items'); // items, categories, or addons
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Item form modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    categoryId: '',
    name: '',
    shortCode: '',
    description: '',
    price: '',
    halfPrice: '',
    acPrice: '',
    acHalfPrice: '',
    gstPercent: 5.0,
    isVeg: true,
    isAvailable: true,
    stockQty: 100,
    isCombo: false,
    comboItems: [],
    addOnIds: [],
    categoryPrices: {}
  });

  // Category form modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', status: true });

  // AddOn form modal states
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [editAddOn, setEditAddOn] = useState(null);
  const [addOnForm, setAddOnForm] = useState({ name: '', price: '', acPrice: '', isAvailable: true, categoryPrices: {} });
  const [tableCategories, setTableCategories] = useState([]);

  const fetchTableCategories = async () => {
    try {
      const { data } = await API.get('/tables/categories');
      setTableCategories(data);
    } catch (error) {
      console.error('Error fetching table categories:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const catRes = await API.get('/menu/categories');
      setCategories(catRes.data);

      const itemsRes = await API.get('/menu/items');
      setMenuItems(itemsRes.data);

      const addonsRes = await API.get('/menu/addons');
      setAddOns(addonsRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTableCategories();
  }, []);

  // Item CRUD
  const handleOpenAddItem = () => {
    setEditItem(null);
    setItemForm({
      categoryId: categories[0]?.id || '',
      name: '',
      shortCode: '',
      description: '',
      price: '',
      halfPrice: '',
      acPrice: '',
      acHalfPrice: '',
      gstPercent: 5.0,
      isVeg: true,
      isAvailable: true,
      stockQty: 100,
      isCombo: false,
      comboItems: [],
      addOnIds: [],
      categoryPrices: {}
    });
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item) => {
    setEditItem(item);
    const catPrices = item.categoryPrices ? (typeof item.categoryPrices === 'string' ? JSON.parse(item.categoryPrices) : item.categoryPrices) : {};
    if (!catPrices['AC'] && (item.acPrice || item.acHalfPrice)) {
      catPrices['AC'] = { price: item.acPrice || '', halfPrice: item.acHalfPrice || '' };
    }
    setItemForm({
      categoryId: item.categoryId,
      name: item.name,
      shortCode: item.shortCode || '',
      description: item.description || '',
      price: item.price,
      halfPrice: item.halfPrice || '',
      acPrice: item.acPrice || '',
      acHalfPrice: item.acHalfPrice || '',
      gstPercent: item.gstPercent,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      stockQty: item.stockQty,
      isCombo: item.isCombo || false,
      comboItems: item.comboItems ? item.comboItems.map(ci => ({ menuItemId: ci.menuItemId, quantity: ci.quantity })) : [],
      addOnIds: item.addOns ? item.addOns.map(a => a.id) : [],
      categoryPrices: catPrices
    });
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price || !itemForm.categoryId) return;

    setIsSubmitting(true);
    try {
      if (editItem) {
        await API.put(`/menu/items/${editItem.id}`, itemForm);
      } else {
        await API.post('/menu/items', itemForm);
      }
      setShowItemModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    setIsSubmitting(true);
    try {
      await API.delete(`/menu/items/${itemId}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Category CRUD
  const handleOpenAddCategory = () => {
    setEditCategory(null);
    setCategoryForm({ name: '', description: '', status: true });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || '',
      status: cat.status
    });
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    setIsSubmitting(true);
    try {
      if (editCategory) {
        await API.put(`/menu/categories/${editCategory.id}`, categoryForm);
      } else {
        await API.post('/menu/categories', categoryForm);
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setIsSubmitting(true);
    try {
      await API.delete(`/menu/categories/${catId}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // AddOn CRUD
  const handleOpenAddAddOn = () => {
    setEditAddOn(null);
    setAddOnForm({ name: '', price: '', acPrice: '', isAvailable: true, categoryPrices: {} });
    setShowAddOnModal(true);
  };

  const handleOpenEditAddOn = (addon) => {
    setEditAddOn(addon);
    const catPrices = addon.categoryPrices ? (typeof addon.categoryPrices === 'string' ? JSON.parse(addon.categoryPrices) : addon.categoryPrices) : {};
    if (catPrices['AC'] === undefined && addon.acPrice) {
      catPrices['AC'] = addon.acPrice;
    }
    setAddOnForm({
      name: addon.name,
      price: addon.price,
      acPrice: addon.acPrice || '',
      isAvailable: addon.isAvailable,
      categoryPrices: catPrices
    });
    setShowAddOnModal(true);
  };

  const handleAddOnSubmit = async (e) => {
    e.preventDefault();
    if (!addOnForm.name || !addOnForm.price) return;

    setIsSubmitting(true);
    try {
      if (editAddOn) {
        await API.put(`/menu/addons/${editAddOn.id}`, addOnForm);
      } else {
        await API.post('/menu/addons', addOnForm);
      }
      setShowAddOnModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddOn = async (addonId) => {
    if (!window.confirm('Are you sure you want to delete this Add-on?')) return;
    setIsSubmitting(true);
    try {
      await API.delete(`/menu/addons/${addonId}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Menu & Categories</h2>
          <p className="text-sm text-slate-500 mt-1">Configure categories, menu dishes, prices, and taxes.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'items' && (
            <button
              onClick={handleOpenAddItem}
              className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Item
            </button>
          )}
          {activeTab === 'categories' && (
            <button
              onClick={handleOpenAddCategory}
              className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Category
            </button>
          )}
          {activeTab === 'addons' && (
            <button
              onClick={handleOpenAddAddOn}
              className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Add-on
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

      {/* Tabs Switch */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'items'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Menu Items ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'categories'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('addons')}
          className={`px-5 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'addons'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Add-ons ({addOns.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Fetching menu definitions...</div>
      ) : activeTab === 'items' ? (
        /* Items Table view */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Name</th>
                <th className="pb-3">Category</th>
                 <th className="pb-3">Pricing (Full / Half)</th>
                <th className="pb-3">GST %</th>
                <th className="pb-3">Veg/Non</th>
                <th className="pb-3">Availability</th>
                <th className="pb-3">Stock Qty</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {menuItems.map((item) => (
                <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 text-slate-850 dark:text-white">
                    <div className="font-bold">{item.name}</div>
                    {item.shortCode && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded uppercase">
                        {item.shortCode}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5">{item.category?.name}</td>
                   <td className="py-3.5 font-semibold">
                    <div>F: Rs. {parseFloat(item.price).toFixed(2)}</div>
                    {item.halfPrice !== null && item.halfPrice !== undefined && parseFloat(item.halfPrice) > 0 && (
                      <div className="text-xs text-slate-400">H: Rs. {parseFloat(item.halfPrice).toFixed(2)}</div>
                    )}
                    {(() => {
                      const catPrices = item.categoryPrices ? (typeof item.categoryPrices === 'string' ? JSON.parse(item.categoryPrices) : item.categoryPrices) : {};
                      const entries = Object.entries(catPrices).filter(([name, val]) => val && (val.price || val.halfPrice));
                      if (entries.length > 0) {
                        return (
                          <div className="mt-1 pt-1 border-t border-dashed border-slate-100 dark:border-slate-800 text-[10px] space-y-0.5 text-blue-600 dark:text-blue-400">
                            {entries.map(([catName, val]) => (
                              <div key={catName}>
                                <span className="font-bold">{catName}</span>: {val.price ? `F: ${parseFloat(val.price).toFixed(0)}` : ''}{val.price && val.halfPrice ? ', ' : ''}{val.halfPrice ? `H: ${parseFloat(val.halfPrice).toFixed(0)}` : ''}
                              </div>
                            ))}
                          </div>
                        );
                      } else if (item.acPrice || item.acHalfPrice) {
                        return (
                          <div className="mt-1 pt-1 border-t border-dashed border-slate-100 dark:border-slate-800 text-[10px] text-blue-600 dark:text-blue-400">
                            {item.acPrice && <div>AC F: Rs. {parseFloat(item.acPrice).toFixed(2)}</div>}
                            {item.acHalfPrice && <div>AC H: Rs. {parseFloat(item.acHalfPrice).toFixed(2)}</div>}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </td>
                  <td className="py-3.5">{parseFloat(item.gstPercent).toFixed(1)}%</td>
                  <td className="py-3.5">{item.isVeg ? '🟢 Veg' : '🔴 Non-veg'}</td>
                  <td className="py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                          : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="py-3.5 font-medium">{item.stockQty}</td>
                  <td className="py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditItem(item)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 dark:border-red-950/30 dark:hover:bg-red-950/20"
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'categories' ? (
        /* Categories Table view */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Name</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {categories.map((cat) => (
                <tr key={cat.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 font-bold text-slate-850 dark:text-white">{cat.name}</td>
                  <td className="py-3.5">{cat.description || 'No description.'}</td>
                  <td className="py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        cat.status
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                          : 'bg-slate-100 text-slate-650'
                      }`}
                    >
                      {cat.status ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 dark:border-red-950/30"
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Add-ons Table view */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Name</th>
                <th className="pb-3">Standard Price</th>
                <th className="pb-3">AC Price</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {addOns.map((addon) => (
                <tr key={addon.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 font-bold text-slate-850 dark:text-white">{addon.name}</td>
                  <td className="py-3.5 font-semibold">Rs. {parseFloat(addon.price).toFixed(2)}</td>
                  <td className="py-3.5 font-semibold text-blue-600 dark:text-blue-400 text-xs">
                    {(() => {
                      const catPrices = addon.categoryPrices ? (typeof addon.categoryPrices === 'string' ? JSON.parse(addon.categoryPrices) : addon.categoryPrices) : {};
                      const entries = Object.entries(catPrices).filter(([name, val]) => val !== undefined && val !== null && val !== '');
                      if (entries.length > 0) {
                        return (
                          <div className="space-y-0.5">
                            {entries.map(([catName, val]) => (
                              <div key={catName}>
                                <span className="font-bold">{catName}</span>: Rs. {parseFloat(val).toFixed(2)}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return addon.acPrice ? `AC: Rs. ${parseFloat(addon.acPrice).toFixed(2)}` : 'N/A';
                    })()}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        addon.isAvailable
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                          : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                      }`}
                    >
                      {addon.isAvailable ? 'Available' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditAddOn(addon)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteAddOn(addon.id)}
                        className="p-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 dark:border-red-950/30"
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Item Form Modal */}
      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title={editItem ? 'Edit Menu Item' : 'Add Menu Item'}>
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Category</label>
              <select
                value={itemForm.categoryId}
                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Item Name</label>
              <input
                type="text"
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Short Code (Optional)</label>
              <input
                type="text"
                value={itemForm.shortCode}
                onChange={(e) => setItemForm({ ...itemForm, shortCode: e.target.value })}
                placeholder="e.g. P101"
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm font-mono uppercase"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Description</label>
            <textarea
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Full Price (Rs.)</label>
              <input
                type="number"
                step="0.01"
                required
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Half Price (Rs.)</label>
              <input
                type="number"
                step="0.01"
                value={itemForm.halfPrice}
                onChange={(e) => setItemForm({ ...itemForm, halfPrice: e.target.value })}
                placeholder="Optional"
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            {/* Dynamic premium categories inputs in grid */}
            {tableCategories.filter(cat => cat.name !== 'Non-AC').map((cat) => {
              const catName = cat.name;
              const currentPrices = itemForm.categoryPrices[catName] || { price: '', halfPrice: '' };
              return (
                <React.Fragment key={cat.id}>
                  <div>
                    <label className="text-xs font-semibold text-blue-500">{catName} Full Price (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      value={currentPrices.price || ''}
                      onChange={(e) => {
                        const updatedPrices = { ...itemForm.categoryPrices };
                        updatedPrices[catName] = { ...currentPrices, price: e.target.value };
                        setItemForm({ ...itemForm, categoryPrices: updatedPrices });
                      }}
                      className="w-full mt-1.5 px-4 py-2 border border-blue-200 dark:border-blue-900 rounded-lg bg-transparent text-sm text-slate-850 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-blue-500">{catName} Half Price (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      value={currentPrices.halfPrice || ''}
                      onChange={(e) => {
                        const updatedPrices = { ...itemForm.categoryPrices };
                        updatedPrices[catName] = { ...currentPrices, halfPrice: e.target.value };
                        setItemForm({ ...itemForm, categoryPrices: updatedPrices });
                      }}
                      className="w-full mt-1.5 px-4 py-2 border border-blue-200 dark:border-blue-900 rounded-lg bg-transparent text-sm text-slate-850 dark:text-white"
                    />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">GST %</label>
              <input
                type="number"
                step="0.1"
                required
                value={itemForm.gstPercent}
                onChange={(e) => setItemForm({ ...itemForm, gstPercent: parseFloat(e.target.value) })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Stock Qty</label>
              <input
                type="number"
                required
                value={itemForm.stockQty}
                onChange={(e) => setItemForm({ ...itemForm, stockQty: parseInt(e.target.value) })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.isVeg}
                onChange={() => setItemForm({ ...itemForm, isVeg: !itemForm.isVeg })}
                className="h-4 w-4 rounded text-green-600 border-slate-350"
              />
              Veg Item 🟢
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.isAvailable}
                onChange={() => setItemForm({ ...itemForm, isAvailable: !itemForm.isAvailable })}
                className="h-4 w-4 rounded text-brand-600 border-slate-350"
              />
              In Stock / Available
            </label>
          </div>

          {/* Combo Meal Toggle and Editor */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.isCombo}
                onChange={() => setItemForm({ ...itemForm, isCombo: !itemForm.isCombo })}
                className="h-4 w-4 rounded text-brand-600 border-slate-350"
              />
              This is a Combo Meal Bundle 🍱
            </label>
            {itemForm.isCombo && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-850 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Constituent Items</span>
                {itemForm.comboItems.map((ci, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      value={ci.menuItemId}
                      required
                      onChange={(e) => {
                        const newComboItems = [...itemForm.comboItems];
                        newComboItems[index].menuItemId = parseInt(e.target.value);
                        setItemForm({ ...itemForm, comboItems: newComboItems });
                      }}
                      className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                    >
                      <option value="" disabled>Select Item</option>
                      {menuItems
                        .filter(item => item.id !== editItem?.id && !item.isCombo) // exclude self and other combos
                        .map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))
                      }
                    </select>
                    <input
                      type="number"
                      min="1"
                      required
                      value={ci.quantity}
                      onChange={(e) => {
                        const newComboItems = [...itemForm.comboItems];
                        newComboItems[index].quantity = parseInt(e.target.value) || 1;
                        setItemForm({ ...itemForm, comboItems: newComboItems });
                      }}
                      className="w-16 px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs text-center font-mono text-slate-850 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newComboItems = itemForm.comboItems.filter((_, idx) => idx !== index);
                        setItemForm({ ...itemForm, comboItems: newComboItems });
                      }}
                      className="text-red-500 hover:text-red-650 text-xs font-semibold px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setItemForm({
                      ...itemForm,
                      comboItems: [...itemForm.comboItems, { menuItemId: '', quantity: 1 }]
                    });
                  }}
                  className="mt-1 text-brand-600 hover:text-brand-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus size={12} /> Add Item to Combo
                </button>
              </div>
            )}
          </div>

          {/* Add-ons Checklist */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Available Add-ons</span>
            <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
              {addOns.map((addon) => {
                const isChecked = itemForm.addOnIds.includes(addon.id);
                return (
                  <label key={addon.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-350 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setItemForm({ ...itemForm, addOnIds: itemForm.addOnIds.filter(id => id !== addon.id) });
                        } else {
                          setItemForm({ ...itemForm, addOnIds: [...itemForm.addOnIds, addon.id] });
                        }
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{addon.name} (+Rs.{parseFloat(addon.price).toFixed(2)})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
            <span>Save Item</span>
          </button>
        </form>
      </Modal>

      {/* Category Form Modal */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editCategory ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Starter Specialties"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Description</label>
            <textarea
              placeholder="Provide category description details..."
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={categoryForm.status}
                onChange={() => setCategoryForm({ ...categoryForm, status: !categoryForm.status })}
                className="h-4 w-4 rounded text-brand-600 border-slate-350"
              />
              Active Category Status
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
            <span>Save Category</span>
          </button>
        </form>
      </Modal>

      {/* Add-on Form Modal */}
      <Modal isOpen={showAddOnModal} onClose={() => setShowAddOnModal(false)} title={editAddOn ? 'Edit Add-on' : 'Add Add-on'}>
        <form onSubmit={handleAddOnSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">Add-on Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Extra Cheese"
              value={addOnForm.name}
              onChange={(e) => setAddOnForm({ ...addOnForm, name: e.target.value })}
              className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-slate-850 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Standard Price (Rs.) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                placeholder="0.00"
                value={addOnForm.price}
                onChange={(e) => setAddOnForm({ ...addOnForm, price: e.target.value })}
                className="w-full mt-1.5 px-4 py-2 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent text-slate-850 dark:text-white"
              />
            </div>
            {tableCategories.filter(cat => cat.name !== 'Non-AC').map((cat) => {
              const catName = cat.name;
              const currentPrice = addOnForm.categoryPrices[catName] || '';
              return (
                <div key={cat.id}>
                  <label className="text-xs font-semibold text-blue-500">{catName} Price (Rs., Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    value={currentPrice}
                    onChange={(e) => {
                      const updatedPrices = { ...addOnForm.categoryPrices };
                      updatedPrices[catName] = e.target.value;
                      setAddOnForm({ ...addOnForm, categoryPrices: updatedPrices });
                    }}
                    className="w-full mt-1.5 px-4 py-2 border border-blue-200 dark:border-blue-900 rounded-lg bg-transparent text-slate-850 dark:text-white"
                  />
                </div>
              );
            })}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={addOnForm.isAvailable}
                onChange={() => setAddOnForm({ ...addOnForm, isAvailable: !addOnForm.isAvailable })}
                className="h-4 w-4 rounded text-brand-600 border-slate-350"
              />
              Available for Purchase
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
            <span>Save Add-on</span>
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default MenuItems;
