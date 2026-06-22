import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, ShoppingCart, Plus, Minus, Trash, Save, UserCheck, Grid, Ticket, CreditCard, ChevronRight, X, AlertTriangle, Printer, Loader2 } from 'lucide-react';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateItemNotes,
  setTable,
  setCustomer,
  applyCoupon,
  removeCoupon,
  setOrderType,
  setWaiter,
  clearCart
} from '../store/slices/cartSlice.js';
import API from '../services/api.js';
import Modal from '../components/Modal.jsx';

const POSBilling = () => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  const getItemPrice = (item) => {
    const tableType = cart.orderType === 'Dine-In' && cart.selectedTable ? cart.selectedTable.tableType : null;
    if (tableType) {
      let catPrices = item.categoryPrices;
      if (typeof catPrices === 'string') {
        try {
          catPrices = JSON.parse(catPrices);
        } catch (e) {
          catPrices = null;
        }
      }
      const categoryPricing = catPrices && catPrices[tableType];

      if (item.portion === 'Half') {
        if (categoryPricing && categoryPricing.halfPrice !== null && categoryPricing.halfPrice !== undefined && categoryPricing.halfPrice !== '') {
          return parseFloat(categoryPricing.halfPrice);
        }
        if (categoryPricing && categoryPricing.price !== null && categoryPricing.price !== undefined && categoryPricing.price !== '') {
          return parseFloat(categoryPricing.price);
        }
        if (tableType === 'AC') {
          if (item.acHalfPrice !== null && item.acHalfPrice !== undefined && item.acHalfPrice !== '') return parseFloat(item.acHalfPrice);
          if (item.acPrice !== null && item.acPrice !== undefined && item.acPrice !== '') return parseFloat(item.acPrice);
        }
        if (item.halfPrice !== null && item.halfPrice !== undefined && item.halfPrice !== '') return parseFloat(item.halfPrice);
        return parseFloat(item.price);
      } else {
        if (categoryPricing && categoryPricing.price !== null && categoryPricing.price !== undefined && categoryPricing.price !== '') {
          return parseFloat(categoryPricing.price);
        }
        if (tableType === 'AC') {
          if (item.acPrice !== null && item.acPrice !== undefined && item.acPrice !== '') return parseFloat(item.acPrice);
        }
        return parseFloat(item.price);
      }
    } else {
      if (item.portion === 'Half') {
        if (item.halfPrice !== null && item.halfPrice !== undefined && item.halfPrice !== '') return parseFloat(item.halfPrice);
        return parseFloat(item.price);
      } else {
        return parseFloat(item.price);
      }
    }
  };

  const getAddOnPrice = (addon, tableType = null) => {
    const resolvedTableType = tableType || (cart.orderType === 'Dine-In' && cart.selectedTable ? cart.selectedTable.tableType : null);
    if (resolvedTableType) {
      let catPrices = addon.categoryPrices;
      if (typeof catPrices === 'string') {
        try {
          catPrices = JSON.parse(catPrices);
        } catch (e) {
          catPrices = null;
        }
      }
      if (catPrices && catPrices[resolvedTableType] !== undefined && catPrices[resolvedTableType] !== null && catPrices[resolvedTableType] !== '') {
        return parseFloat(catPrices[resolvedTableType]);
      }
      if (resolvedTableType === 'AC' && addon.acPrice !== null && addon.acPrice !== undefined && addon.acPrice !== '') {
        return parseFloat(addon.acPrice);
      }
    }
    return parseFloat(addon.price);
  };

  const getItemTotalPrice = (item) => {
    const basePrice = getItemPrice(item);
    let addOnsPrice = 0;
    if (item.addOns && Array.isArray(item.addOns)) {
      item.addOns.forEach(addon => {
        addOnsPrice += getAddOnPrice(addon);
      });
    }
    return basePrice + addOnsPrice;
  };

  const getMenuItemDisplayPrice = (item, portion = 'Full') => {
    const tableType = cart.orderType === 'Dine-In' && cart.selectedTable ? cart.selectedTable.tableType : null;
    if (tableType) {
      let catPrices = item.categoryPrices;
      if (typeof catPrices === 'string') {
        try {
          catPrices = JSON.parse(catPrices);
        } catch (e) {
          catPrices = null;
        }
      }
      const categoryPricing = catPrices && catPrices[tableType];

      if (portion === 'Half') {
        if (categoryPricing && categoryPricing.halfPrice !== null && categoryPricing.halfPrice !== undefined && categoryPricing.halfPrice !== '') {
          return parseFloat(categoryPricing.halfPrice);
        }
        if (categoryPricing && categoryPricing.price !== null && categoryPricing.price !== undefined && categoryPricing.price !== '') {
          return parseFloat(categoryPricing.price);
        }
        if (tableType === 'AC') {
          if (item.acHalfPrice !== null && item.acHalfPrice !== undefined && item.acHalfPrice !== '') return parseFloat(item.acHalfPrice);
          if (item.acPrice !== null && item.acPrice !== undefined && item.acPrice !== '') return parseFloat(item.acPrice);
        }
        if (item.halfPrice !== null && item.halfPrice !== undefined && item.halfPrice !== '') return parseFloat(item.halfPrice);
        return parseFloat(item.price);
      } else {
        if (categoryPricing && categoryPricing.price !== null && categoryPricing.price !== undefined && categoryPricing.price !== '') {
          return parseFloat(categoryPricing.price);
        }
        if (tableType === 'AC') {
          if (item.acPrice !== null && item.acPrice !== undefined && item.acPrice !== '') return parseFloat(item.acPrice);
        }
        return parseFloat(item.price);
      }
    } else {
      if (portion === 'Half') {
        if (item.halfPrice !== null && item.halfPrice !== undefined && item.halfPrice !== '') return parseFloat(item.halfPrice);
        return parseFloat(item.price);
      } else {
        return parseFloat(item.price);
      }
    }
  };

  // States
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [popularItemIds, setPopularItemIds] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals status
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showMobileCartModal, setShowMobileCartModal] = useState(false);

  // Customization modal states
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState(null);
  const [customizationPortion, setCustomizationPortion] = useState('Full');
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    shortCode: '',
    categoryId: '',
    price: '',
    halfPrice: '',
    gstPercent: 5.00,
    isVeg: true,
    description: ''
  });

  // Input states
  const [tablesList, setTablesList] = useState([]);
  const [tableCategories, setTableCategories] = useState([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [customerFound, setCustomerFound] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponsList, setCouponsList] = useState([]);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('Cash');

  // Print references
  const printAreaRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const catRes = await API.get('/menu/categories');
        setCategories(catRes.data);

        const menuRes = await API.get('/menu/items');
        setMenuItems(menuRes.data);
        setFilteredItems(menuRes.data);

        const tablesRes = await API.get('/tables');
        setTablesList(tablesRes.data);

        const couponsRes = await API.get('/pos/coupons');
        setCouponsList(couponsRes.data);

        try {
          const tableCatsRes = await API.get('/tables/categories');
          setTableCategories(tableCatsRes.data);
        } catch (tableCatsErr) {
          console.error('Error fetching table categories:', tableCatsErr);
        }

        try {
          const popularRes = await API.get('/menu/items/popular');
          setPopularItemIds(popularRes.data.map(item => item.id));
        } catch (popularErr) {
          console.error('Error fetching popular items:', popularErr);
        }
      } catch (error) {
        console.error('Error fetching POS data:', error);
      }
    };
    fetchInitialData();
  }, []);

  // Filter Menu Items based on Category, Search query, and Veg checkbox
  useEffect(() => {
    let result = menuItems;

    if (selectedCategory === 'Popular') {
      result = result.filter(item => popularItemIds.includes(item.id));
    } else if (selectedCategory !== 'All') {
      result = result.filter(item => item.categoryId === selectedCategory);
    }

    if (searchQuery) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.shortCode && item.shortCode.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (vegOnly) {
      result = result.filter(item => item.isVeg);
    }

    setFilteredItems(result);
  }, [selectedCategory, searchQuery, vegOnly, menuItems, popularItemIds]);

  // Cart Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let gstAmount = 0;

    cart.items.forEach(item => {
      const price = getItemTotalPrice(item);
      const qty = parseInt(item.quantity);
      const gst = parseFloat(item.gstPercent);

      const itemSubtotal = price * qty;
      subtotal += itemSubtotal;
      gstAmount += itemSubtotal * (gst / 100);
    });

    let discount = 0;
    if (cart.coupon) {
      if (cart.coupon.discountType === 'Percentage') {
        discount = subtotal * (parseFloat(cart.coupon.discountValue) / 100);
      } else {
        discount = parseFloat(cart.coupon.discountValue);
      }
    }

    const total = subtotal + gstAmount - discount;
    return {
      subtotal,
      gstAmount,
      discount,
      total: total < 0 ? 0 : total
    };
  };

  const { subtotal, gstAmount, discount, total } = calculateTotals();

  // Handlers
  const handleAssignTable = (table) => {
    dispatch(setTable(table));
    setShowTableModal(false);
  };

  const handleSearchCustomer = async () => {
    if (!customerPhone) return;
    setIsSubmitting(true);
    try {
      const { data } = await API.get(`/pos/customers/search?phone=${customerPhone}`);
      setCustomerInfo(data);
      setCustomerFound(true);
    } catch (error) {
      setCustomerFound(false);
      alert('Customer not found. You can register them below.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterCustomer = async () => {
    if (!customerInfo.name || !customerInfo.phone) return;
    setIsSubmitting(true);
    try {
      const { data } = await API.post('/pos/customers', customerInfo);
      dispatch(setCustomer(data));
      setShowCustomerModal(false);
      setCustomerInfo({ name: '', phone: '', email: '' });
      setCustomerPhone('');
      setCustomerFound(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyCoupon = async () => {
    setIsSubmitting(true);
    try {
      const { data } = await API.post('/pos/coupons/validate', {
        code: couponCode,
        amount: subtotal
      });
      dispatch(applyCoupon(data));
      setShowCouponModal(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await API.post('/menu/items', newItemForm);
      setMenuItems(prev => [data, ...prev]);
      dispatch(addToCart(data));
      setShowAddItemModal(false);
      setNewItemForm({
        name: '',
        shortCode: '',
        categoryId: '',
        price: '',
        halfPrice: '',
        gstPercent: 5.00,
        isVeg: true,
        description: ''
      });
      setSearchQuery('');
      alert('New item added to menu and cart!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async (isHeld = false, shouldPrintKOT = false) => {
    if (cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    if (cart.orderType === 'Dine-In' && !cart.selectedTable) {
      alert('Please select a table for Dine-In orders');
      return;
    }

    // Capture items for print before clearing the cart
    const itemsToPrint = [...cart.items];
    const orderType = cart.orderType;
    const tableNumber = cart.selectedTable?.tableNumber || '';
    const waiterName = cart.waiterName || 'Cashier';

    setIsSubmitting(true);
    try {
      const orderPayload = {
        tableId: cart.selectedTable?.id || null,
        customerId: cart.selectedCustomer?.id || null,
        type: cart.orderType,
        items: cart.items.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          notes: item.notes,
          portion: item.portion || 'Full',
          addOnIds: item.addOns ? item.addOns.map(addon => addon.id) : []
        })),
        waiterName: cart.waiterName || 'Cashier',
        couponCode: cart.coupon?.code || null,
        isHeld,
        draftOrderId: cart.draftOrderId
      };

      const { data } = await API.post('/pos/orders', orderPayload);

      if (shouldPrintKOT) {
        setPrintData({
          type: 'KOT',
          kotNumber: data.kotNumber || ('KOT-' + Date.now()),
          items: itemsToPrint,
          orderType,
          tableNumber,
          waiterName,
          createdAt: new Date().toISOString()
        });

        setTimeout(() => {
          window.print();
          setPrintData(null);
          dispatch(clearCart());
        }, 300);
      } else {
        alert(isHeld ? 'Order saved as draft!' : 'KOT generated and Order sent to Kitchen!');
        dispatch(clearCart());
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (cart.items.length === 0) return;
    if (cart.orderType === 'Dine-In' && !cart.selectedTable) return;

    setIsSubmitting(true);
    try {
      // 1. Create order first
      const orderPayload = {
        tableId: cart.selectedTable?.id || null,
        customerId: cart.selectedCustomer?.id || null,
        type: cart.orderType,
        items: cart.items.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          notes: item.notes,
          portion: item.portion || 'Full',
          addOnIds: item.addOns ? item.addOns.map(addon => addon.id) : []
        })),
        waiterName: cart.waiterName || 'Cashier',
        couponCode: cart.coupon?.code || null,
        isHeld: false
      };

      const orderRes = await API.post('/pos/orders', orderPayload);
      const orderId = orderRes.data.orderId;

      // 2. Perform instant checkout
      await API.post(`/pos/orders/${orderId}/checkout`, {
        paymentMethod: checkoutPaymentMethod,
        amountPaid: total
      });

      setShowCheckoutModal(false);
      
      // Trigger print dialog
      setTimeout(() => {
        window.print();
        dispatch(clearCart());
      }, 300);

    } catch (error) {
      alert(error.response?.data?.message || 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBillingSummary = (isMobile = false) => {
    return (
      <div className={`flex flex-col h-full ${isMobile ? '' : 'p-0'}`}>
        {/* Order Type & Actions */}
        <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          {['Dine-In', 'Takeaway', 'Delivery'].map((type) => (
            <button
              key={type}
              onClick={() => dispatch(setOrderType(type))}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                cart.orderType === type
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Dynamic assignments bar */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => cart.orderType === 'Dine-In' && setShowTableModal(true)}
            disabled={cart.orderType !== 'Dine-In'}
            className="flex items-center justify-between px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
              <Grid size={14} /> Table
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {cart.selectedTable ? cart.selectedTable.tableNumber : 'Assign'}
            </span>
          </button>

          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center justify-between px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
              <UserCheck size={14} /> Loyalty
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400 truncate max-w-[80px]">
              {cart.selectedCustomer ? cart.selectedCustomer.name : 'Assign'}
            </span>
          </button>
        </div>

        {/* Cart Item rows list */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
              <ShoppingCart size={40} className="mb-2 opacity-50" />
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.cartItemId} className="flex justify-between items-start gap-4 animate-fadeIn">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px]">{item.isVeg ? '🟢' : '🔴'}</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-white">
                      {item.name}
                    </span>
                    {item.portion === 'Half' && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-400">
                        Half
                      </span>
                    )}
                  </div>
                  {/* Render Addons */}
                  {item.addOns && item.addOns.length > 0 && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-4">
                      <span className="font-semibold">Add-ons:</span>{' '}
                      {item.addOns.map(addon => {
                        const price = getAddOnPrice(addon);
                        return `${addon.name} (+Rs.${parseFloat(price).toFixed(2)})`;
                      }).join(', ')}
                    </div>
                  )}
                  {/* Render Combo Constituents */}
                  {item.isCombo && item.comboItems && item.comboItems.length > 0 && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-4">
                      <span className="font-semibold text-indigo-650 dark:text-indigo-400">Combo:</span>{' '}
                      {item.comboItems.map(ci => `${ci.menuItem?.name || 'Item'} (x${ci.quantity})`).join(', ')}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Add cooking notes..."
                    value={item.notes}
                    onChange={(e) => dispatch(updateItemNotes({ cartItemId: item.cartItemId, notes: e.target.value }))}
                    className="w-full text-[11px] text-slate-400 dark:text-slate-500 bg-transparent border-b border-transparent focus:border-slate-200 outline-none mt-0.5"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                    <button
                      onClick={() => dispatch(updateQuantity({ cartItemId: item.cartItemId, quantity: item.quantity - 1 }))}
                      className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateQuantity({ cartItemId: item.cartItemId, quantity: item.quantity + 1 }))}
                      className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className={`font-extrabold text-sm w-16 text-right ${cart.orderType === 'Dine-In' && cart.selectedTable?.tableType && cart.selectedTable.tableType !== 'Non-AC' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                    Rs. {(getItemTotalPrice(item) * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => dispatch(removeFromCart(item.cartItemId))}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals Summary */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-3 space-y-2">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>GST Amount</span>
            <span>Rs. {gstAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Coupon Discount</span>
            {cart.coupon ? (
              <span className="text-emerald-500 flex items-center gap-1">
                -Rs. {discount.toFixed(2)}
                <X size={10} className="cursor-pointer" onClick={() => dispatch(removeCoupon())} />
              </span>
            ) : (
              <span onClick={() => {
                if (isMobile) {
                  setShowMobileCartModal(false);
                }
                setShowCouponModal(true);
              }} className="text-brand-600 dark:text-brand-400 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                <Ticket size={12} /> Apply Coupon
              </span>
            )}
          </div>

          {cart.orderType === 'Dine-In' && cart.selectedTable?.tableType && cart.selectedTable.tableType !== 'Non-AC' && (
            <div className="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 mt-1">
              <span>{cart.selectedTable.tableType} Seating Pricing Active</span>
              <span className="text-[10px] bg-blue-600 text-white dark:bg-blue-500 px-1.5 py-0.5 rounded uppercase font-bold">{cart.selectedTable.tableType}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-extrabold text-slate-800 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Total Payable</span>
            <span>Rs. {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action checkout buttons */}
        <div className="grid grid-cols-4 gap-1.5 mt-5 expired-hide">
          <button
            disabled={isSubmitting}
            onClick={() => {
              if (isMobile) setShowMobileCartModal(false);
              handlePlaceOrder(true);
            }}
            className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl py-3 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin text-slate-500" size={16} /> : <Save size={16} />}
            <span className="text-[9px] font-bold mt-1">Save Draft</span>
          </button>
          <button
            disabled={isSubmitting}
            onClick={() => {
              if (isMobile) setShowMobileCartModal(false);
              handlePlaceOrder(false);
            }}
            className="flex flex-col items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-xl py-3 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-455 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin text-indigo-500" size={16} /> : <Save size={16} />}
            <span className="text-[9px] font-bold mt-1">KOT Only</span>
          </button>
          <button
            disabled={isSubmitting}
            onClick={() => {
              if (isMobile) setShowMobileCartModal(false);
              handlePlaceOrder(false, true);
            }}
            className="flex flex-col items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-xl py-3 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-450 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin text-emerald-500" size={16} /> : <Printer size={16} />}
            <span className="text-[9px] font-bold mt-1">KOT & Print</span>
          </button>
          <button
            disabled={isSubmitting}
            onClick={() => {
              if (isMobile) setShowMobileCartModal(false);
              setShowCheckoutModal(true);
            }}
            className="flex flex-col items-center justify-center bg-brand-600 text-white hover:bg-brand-700 rounded-xl py-3 shadow-md disabled:opacity-50"
          >
            <CreditCard size={16} />
            <span className="text-[9px] font-bold mt-1">Checkout</span>
          </button>
        </div>

      </div>
    );
  };

  return (
    <div className="grid h-[calc(100vh-8.5rem)] grid-cols-1 gap-6 md:grid-cols-12">
      
      {/* 1. Menu Selection Section (Left 7 Cols) */}
      <div className="flex flex-col h-full md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 overflow-hidden">
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search dishes by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={() => setVegOnly(!vegOnly)}
                className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              Veg Only 🟢
            </label>
            <button
              onClick={() => {
                setNewItemForm({
                  name: '',
                  shortCode: '',
                  categoryId: '',
                  price: '',
                  halfPrice: '',
                  gstPercent: 5.00,
                  isVeg: true,
                  description: ''
                });
                setShowAddItemModal(true);
              }}
              className="bg-brand-50 border border-brand-100 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 dark:bg-brand-950/20 dark:border-brand-900/30 dark:text-brand-400 whitespace-nowrap shadow-sm transition-all"
            >
              <Plus size={12} /> Add Dish
            </button>
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`rounded-full px-5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setSelectedCategory('Popular')}
            className={`rounded-full px-5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'Popular'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            🔥 Best Sellers
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/20 max-w-md mx-auto my-auto transition-all">
            <div className="p-4 bg-brand-50 dark:bg-brand-950/30 rounded-full text-brand-500 mb-4 animate-pulse">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              No dishes found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
              We couldn't find any menu items matching "{searchQuery}". You can quickly register it on the fly.
            </p>
            <button
              onClick={() => {
                setNewItemForm({
                  name: searchQuery,
                  shortCode: '',
                  categoryId: selectedCategory !== 'All' ? selectedCategory : (categories[0]?.id || ''),
                  price: '',
                  halfPrice: '',
                  gstPercent: 5.00,
                  isVeg: true,
                  description: ''
                });
                setShowAddItemModal(true);
              }}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={16} /> Quick Add "{searchQuery}"
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 pr-1 xs:block">
            {filteredItems.map((item) => {
              const hasHalf = item.halfPrice !== null && item.halfPrice !== undefined && parseFloat(item.halfPrice) > 0;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.isCombo || (item.addOns && item.addOns.length > 0)) {
                      setSelectedItemForCustomization(item);
                      setCustomizationPortion('Full');
                      setSelectedAddOns([]);
                    } else if (!hasHalf && item.isAvailable) {
                      dispatch(addToCart({ ...item, portion: 'Full' }));
                    }
                  }}
                  className="flex flex-col justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 transition-all group cursor-pointer hover:shadow-md"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs">
                        {item.isVeg ? '🟢 Veg' : '🔴 Non-veg'}
                      </span>
                      {!item.isAvailable && (
                        <span className="bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Out of stock
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white mt-2 group-hover:text-brand-500 transition-colors flex items-center gap-1.5 flex-wrap">
                      {item.name}
                      {item.shortCode && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 uppercase">
                          {item.shortCode}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {item.description || 'No description available.'}
                    </p>
                  </div>
                  
                  {hasHalf ? (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-brand-500 transition-all">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Half</span>
                          <span className={`text-xs font-extrabold ${cart.orderType === 'Dine-In' && cart.selectedTable?.tableType && cart.selectedTable.tableType !== 'Non-AC' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                            Rs. {getMenuItemDisplayPrice(item, 'Half').toFixed(2)}
                          </span>
                        </div>
                        <button
                          disabled={!item.isAvailable}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.isCombo || (item.addOns && item.addOns.length > 0)) {
                              setSelectedItemForCustomization(item);
                              setCustomizationPortion('Half');
                              setSelectedAddOns([]);
                            } else {
                              dispatch(addToCart({ ...item, portion: 'Half' }));
                            }
                          }}
                          className="rounded bg-brand-50 hover:bg-brand-500 text-brand-600 hover:text-white p-1 dark:bg-brand-950/40 dark:text-brand-400 dark:hover:bg-brand-500 dark:hover:text-white transition-colors disabled:opacity-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-brand-500 transition-all">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Full</span>
                          <span className={`text-xs font-extrabold ${cart.orderType === 'Dine-In' && cart.selectedTable?.tableType && cart.selectedTable.tableType !== 'Non-AC' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                            Rs. {getMenuItemDisplayPrice(item, 'Full').toFixed(2)}
                          </span>
                        </div>
                        <button
                          disabled={!item.isAvailable}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.isCombo || (item.addOns && item.addOns.length > 0)) {
                              setSelectedItemForCustomization(item);
                              setCustomizationPortion('Full');
                              setSelectedAddOns([]);
                            } else {
                              dispatch(addToCart({ ...item, portion: 'Full' }));
                            }
                          }}
                          className="rounded bg-brand-50 hover:bg-brand-500 text-brand-600 hover:text-white p-1 dark:bg-brand-950/40 dark:text-brand-400 dark:hover:bg-brand-500 dark:hover:text-white transition-colors disabled:opacity-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mt-4">
                      <span className={`font-extrabold ${cart.orderType === 'Dine-In' && cart.selectedTable?.tableType && cart.selectedTable.tableType !== 'Non-AC' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                        Rs. {getMenuItemDisplayPrice(item, 'Full').toFixed(2)}
                      </span>
                      <button
                        disabled={!item.isAvailable}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.isCombo || (item.addOns && item.addOns.length > 0)) {
                            setSelectedItemForCustomization(item);
                            setCustomizationPortion('Full');
                            setSelectedAddOns([]);
                          } else {
                            dispatch(addToCart({ ...item, portion: 'Full' }));
                          }
                        }}
                        className="rounded-lg bg-white p-1.5 border border-slate-200 text-slate-600 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-brand-500 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Billing Summary Section (Right 5 Cols - Hidden on Mobile) */}
      <div className="hidden md:flex flex-col h-full md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 overflow-hidden">
        {renderBillingSummary(false)}
      </div>

      {/* Floating Cart FAB/Badge for Mobile View */}
      {cart.items.length > 0 && (
        <button
          onClick={() => setShowMobileCartModal(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-brand-600 text-white font-extrabold px-5 py-4 rounded-full shadow-2xl hover:bg-brand-700 transition-all hover:scale-105 active:scale-95 border-2 border-white dark:border-slate-800"
        >
          <div className="relative">
            <ShoppingCart size={20} />
            <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-brand-600 animate-bounce">
              {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <span className="text-xs uppercase tracking-wider">View Cart (Rs. {total.toFixed(2)})</span>
        </button>
      )}

      {/* Mobile Cart Modal */}
      {showMobileCartModal && (
        <Modal
          isOpen={showMobileCartModal}
          onClose={() => setShowMobileCartModal(false)}
          title="Cart & Billing Summary"
          size="lg"
        >
          <div className="h-[75vh] md:h-[600px] overflow-hidden p-4">
            {renderBillingSummary(true)}
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 3. MODALS CONTAINER */}
      {/* ======================================================== */}

      {/* Customization modal */}
      <Modal
        isOpen={selectedItemForCustomization !== null}
        onClose={() => setSelectedItemForCustomization(null)}
        title={`Customize ${selectedItemForCustomization?.name}`}
      >
        {selectedItemForCustomization && (
          <div className="space-y-5">
            {/* Dietary tags */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350">
                {selectedItemForCustomization.isVeg ? '🟢 Veg' : '🔴 Non-veg'}
              </span>
              {selectedItemForCustomization.isCombo && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-400">
                  Combo Meal
                </span>
              )}
            </div>

            {/* Portions selection if halfPrice exists */}
            {selectedItemForCustomization.halfPrice !== null && parseFloat(selectedItemForCustomization.halfPrice) > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Select Portion</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Half', 'Full'].map((p) => {
                    const price = getMenuItemDisplayPrice(selectedItemForCustomization, p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCustomizationPortion(p)}
                        className={`py-3 px-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          customizationPortion === p
                            ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950/20 dark:border-brand-500 dark:text-brand-400'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-sm font-bold">{p}</span>
                        <span className="text-xs mt-1 opacity-80">Rs. {price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Combo constituent items display */}
            {selectedItemForCustomization.isCombo && selectedItemForCustomization.comboItems && selectedItemForCustomization.comboItems.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Combo Includes</h5>
                <ul className="space-y-1.5">
                  {selectedItemForCustomization.comboItems.map((ci) => (
                    <li key={ci.id} className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>{ci.menuItem?.name || 'Item'}</span>
                      <span className="font-semibold text-slate-500 font-mono">x{ci.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add-ons selection */}
            {selectedItemForCustomization.addOns && selectedItemForCustomization.addOns.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Available Add-ons</label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {selectedItemForCustomization.addOns.map((addon) => {
                    const price = getAddOnPrice(addon);
                    const isSelected = selectedAddOns.some(a => a.id === addon.id);
                    return (
                      <label
                        key={addon.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-slate-50 border-brand-500 dark:bg-slate-800/40 dark:border-brand-500'
                            : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
                              } else {
                                setSelectedAddOns([...selectedAddOns, addon]);
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{addon.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                          +Rs. {parseFloat(price).toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total display inside modal */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Unit Price:</span>
                <div className="text-base font-extrabold text-slate-800 dark:text-white">
                  Rs. {(
                    getMenuItemDisplayPrice(selectedItemForCustomization, customizationPortion) +
                    selectedAddOns.reduce((sum, addon) => {
                      const price = getAddOnPrice(addon);
                      return sum + parseFloat(price);
                    }, 0)
                  ).toFixed(2)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  dispatch(addToCart({
                    ...selectedItemForCustomization,
                    portion: customizationPortion,
                    addOns: selectedAddOns
                  }));
                  setSelectedItemForCustomization(null);
                }}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                Add to Cart
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Table selector modal */}
      <Modal isOpen={showTableModal} onClose={() => setShowTableModal(false)} title="Select dining table">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
          {Object.entries((() => {
            const grouped = {};
            tablesList.forEach(tbl => {
              const type = tbl.tableType || 'Non-AC';
              if (!grouped[type]) grouped[type] = [];
              grouped[type].push(tbl);
            });
            return grouped;
          })()).map(([categoryName, catTables]) => (
            <div key={categoryName} className="space-y-2">
              <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{categoryName} Seating</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-extrabold px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/50">{catTables.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {catTables.map((tbl) => (
                  <button
                    key={tbl.id}
                    onClick={() => handleAssignTable(tbl)}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                      cart.selectedTable?.id === tbl.id
                        ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                        : tbl.status === 'Occupied'
                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-955/20 dark:border-indigo-900/30 dark:text-amber-400'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base font-bold">{tbl.tableNumber}</span>
                    <span className="text-[10px] mt-1">Capacity: {tbl.capacity}</span>
                    <span className={`text-[9px] mt-0.5 font-bold ${tbl.status === 'Occupied' ? 'text-amber-600 dark:text-amber-455' : 'text-slate-450'}`}>
                      {tbl.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Customer Loyalty modal */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Assign customer loyalty account">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search customer by 10-digit phone number..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:outline-none"
            />
            <button
              disabled={isSubmitting}
              onClick={handleSearchCustomer}
              className="bg-brand-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : null}
              <span>Find</span>
            </button>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h4 className="font-semibold text-sm mb-3">Customer Details (or register new)</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Phone</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. john@doe.com"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent"
                />
              </div>

              {customerFound && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400">
                  <span className="text-xs font-bold">Existing Customer Profile found:</span>
                  <p className="text-sm mt-0.5">{customerInfo.name} - ({customerInfo.points || 0} loyalty points)</p>
                  <button
                    onClick={() => {
                      dispatch(setCustomer(customerInfo));
                      setShowCustomerModal(false);
                      setCustomerInfo({ name: '', phone: '', email: '' });
                      setCustomerPhone('');
                      setCustomerFound(false);
                    }}
                    className="mt-2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    Use this Customer
                  </button>
                </div>
              )}

              {!customerFound && (
                <button
                  disabled={isSubmitting}
                  onClick={handleRegisterCustomer}
                  className="w-full bg-brand-500 text-white font-semibold py-2 rounded-lg mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                  <span>Register & Use Customer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Coupon code selector modal */}
      <Modal isOpen={showCouponModal} onClose={() => setShowCouponModal(false)} title="Apply Coupon Code">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter promo coupon code..."
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:outline-none"
            />
            <button
              disabled={isSubmitting}
              onClick={handleApplyCoupon}
              className="bg-brand-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : null}
              <span>Verify</span>
            </button>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h4 className="font-semibold text-sm mb-3">Available Promos</h4>
            <div className="space-y-2">
              {couponsList.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setCouponCode(c.code);
                  }}
                  className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-brand-600 dark:text-brand-400">{c.code}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.discountType === 'Percentage' ? `${c.discountValue}% off` : `Rs. ${c.discountValue} off`}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">Min Order: Rs. {c.minOrderAmount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Checkout selection modal */}
      <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Finalize Payment & Checkout">
        <div className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl dark:bg-slate-950">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Bill Amount:</span>
              <span className="text-lg font-extrabold text-slate-800 dark:text-white">Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Payment Channel</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {['Cash', 'Card', 'UPI'].map((method) => (
                <button
                  key={method}
                  disabled={isSubmitting}
                  onClick={() => setCheckoutPaymentMethod(method)}
                  className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                    checkoutPaymentMethod === method
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              disabled={isSubmitting}
              onClick={handleCheckoutSubmit}
              className="w-full bg-brand-600 text-white hover:bg-brand-700 font-bold py-3 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
              <span>Complete Checkout & Print Bill</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Add Menu Item Modal */}
      <Modal isOpen={showAddItemModal} onClose={() => setShowAddItemModal(false)} title="Quick Add Menu Item">
        <form onSubmit={handleAddItemSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Dish Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Garlic Bread"
                value={newItemForm.name}
                onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Short Code</label>
              <input
                type="text"
                placeholder="e.g. G01"
                value={newItemForm.shortCode}
                onChange={(e) => setNewItemForm({ ...newItemForm, shortCode: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-white font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Category *</label>
              <select
                required
                value={newItemForm.categoryId}
                onChange={(e) => setNewItemForm({ ...newItemForm, categoryId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-white"
              >
                <option value="" disabled>Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Full Price (Rs.) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={newItemForm.price}
                onChange={(e) => setNewItemForm({ ...newItemForm, price: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Half Price (Rs.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={newItemForm.halfPrice}
                onChange={(e) => setNewItemForm({ ...newItemForm, halfPrice: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">GST Tax Rate *</label>
              <select
                required
                value={newItemForm.gstPercent}
                onChange={(e) => setNewItemForm({ ...newItemForm, gstPercent: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-white"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5% (Standard Restaurant)</option>
                <option value="12">12% (Premium/Beverages)</option>
                <option value="18">18% (Luxury/Specialty)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Dietary Preference</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setNewItemForm({ ...newItemForm, isVeg: true })}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    newItemForm.isVeg
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800'
                  }`}
                >
                  🟢 Veg
                </button>
                <button
                  type="button"
                  onClick={() => setNewItemForm({ ...newItemForm, isVeg: false })}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    !newItemForm.isVeg
                      ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800'
                  }`}
                >
                  🔴 Non-Veg
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Description (Optional)</label>
            <textarea
              placeholder="Brief description of ingredients or preparation..."
              value={newItemForm.description}
              onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
              rows="2"
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-white text-sm"
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowAddItemModal(false)}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
              <span>Create & Add to Cart</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 4. PRINT TEMPLATE SECTION (Hidden in standard screen) */}
      {/* ======================================================== */}
      {(!printData || printData.type === 'Bill') && (
        <div
          id="thermal-bill"
          className="hidden print:block w-[80mm] text-slate-900 bg-white p-4 font-mono text-[11px] leading-relaxed mx-auto"
        >
          <div className="text-center font-bold text-base uppercase border-b border-dashed border-slate-900 pb-2 mb-2">
            Sonket Cafe & Grill
          </div>
          <div className="mb-2 text-center">
            <p>Sector-5, Wholesale Hub, City</p>
            <p>Phone: +91 9988776655</p>
            <p>GSTIN: 07AAAAA1111A1Z1</p>
          </div>
          <div className="border-b border-dashed border-slate-900 pb-2 mb-2">
            <p>Bill: {Date.now()}</p>
            <p>Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            <p>Type: {cart.orderType} {cart.selectedTable ? `(Table: ${cart.selectedTable.tableNumber})` : ''}</p>
            <p>Cashier: {cart.waiterName || 'Staff'}</p>
            {cart.selectedCustomer && <p>Customer: {cart.selectedCustomer.name}</p>}
          </div>
          <table className="w-full text-left mb-2">
            <thead>
              <tr className="border-b border-dashed border-slate-900 font-bold">
                <th className="pb-1">Item</th>
                <th className="pb-1 text-center">Qty</th>
                <th className="pb-1 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <React.Fragment key={item.cartItemId}>
                  <tr className="border-b border-dotted border-slate-200">
                    <td className="py-1">
                      <div className="font-bold">{item.name}{item.portion === 'Half' ? ' (Half)' : ''}</div>
                      {item.addOns && item.addOns.length > 0 && (
                        <div className="text-[9px] pl-2 text-slate-700">
                          + {item.addOns.map(addon => {
                            const price = getAddOnPrice(addon);
                            return `${addon.name} (Rs.${parseFloat(price).toFixed(2)})`;
                          }).join(', ')}
                        </div>
                      )}
                      {item.isCombo && item.comboItems && item.comboItems.length > 0 && (
                        <div className="text-[9px] pl-2 text-indigo-700 font-semibold">
                          Incl: {item.comboItems.map(ci => `${ci.menuItem?.name || 'Item'} (x${ci.quantity})`).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-1 text-center align-top">{item.quantity}</td>
                    <td className="py-1 text-right align-top">Rs. {(getItemTotalPrice(item) * item.quantity).toFixed(2)}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="border-t border-dashed border-slate-900 pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Amt:</span>
              <span>Rs. {gstAmount.toFixed(2)}</span>
            </div>
            {cart.coupon && (
              <div className="flex justify-between font-bold text-emerald-600">
                <span>Promo Applied:</span>
                <span>-Rs. {discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-dashed border-slate-900 pt-1 font-bold text-sm">
              <span>Net Payable:</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-center font-bold border-t border-dashed border-slate-900 pt-3 mt-3">
            *** Thank You! Visit Again ***
          </div>
        </div>
      )}

      {printData && printData.type === 'KOT' && (
        <div
          id="thermal-kot"
          className="hidden print:block w-[80mm] text-slate-900 bg-white p-4 font-mono text-[11px] leading-relaxed mx-auto"
        >
          <div className="text-center font-bold text-sm uppercase border-b border-dashed border-slate-900 pb-2 mb-2">
            KITCHEN ORDER TICKET (KOT)
          </div>
          <div className="border-b border-dashed border-slate-900 pb-2 mb-2">
            <p className="font-bold text-xs">KOT No: {printData.kotNumber}</p>
            <p>Date: {new Date(printData.createdAt).toLocaleDateString()} {new Date(printData.createdAt).toLocaleTimeString()}</p>
            <p>Type: {printData.orderType} {printData.tableNumber ? `(Table: ${printData.tableNumber})` : ''}</p>
            <p>Waiter: {printData.waiterName || 'Staff'}</p>
          </div>
          <table className="w-full text-left mb-2">
            <thead>
              <tr className="border-b border-dashed border-slate-900 font-bold">
                <th className="pb-1">Item</th>
                <th className="pb-1 text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {printData.items.map((item) => (
                <React.Fragment key={item.cartItemId || item.id}>
                  <tr className="border-b border-dotted border-slate-200">
                    <td className="py-1">
                      <div className="font-bold">{item.name}{item.portion === 'Half' ? ' (Half)' : ''}</div>
                      {item.addOns && item.addOns.length > 0 && (
                        <div className="text-[9px] pl-2 text-slate-700">
                          + {item.addOns.map(addon => addon.name).join(', ')}
                        </div>
                      )}
                      {item.isCombo && item.comboItems && item.comboItems.length > 0 && (
                        <div className="text-[9px] pl-2 text-indigo-750 font-semibold">
                          Incl: {item.comboItems.map(ci => `${ci.menuItem?.name || 'Item'} (x${ci.quantity})`).join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[10px] pl-2 text-red-650 font-bold italic mt-0.5">
                          * Note: {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-1 text-right align-top font-extrabold text-sm">{item.quantity}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="text-center font-bold border-t border-dashed border-slate-900 pt-3 mt-3">
            *** Sent to Kitchen ***
          </div>
        </div>
      )}

    </div>
  );
};

export default POSBilling;
