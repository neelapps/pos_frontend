import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  selectedTable: null,
  selectedCustomer: null,
  coupon: null,
  orderType: 'Dine-In',
  waiterName: '',
  draftOrderId: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { id, name, price, halfPrice, acPrice, acHalfPrice, gstPercent, isVeg, portion, addOns, isCombo, comboItems } = action.payload;
      const itemPortion = portion || 'Full';
      const selectedAddOns = addOns || [];
      const addOnIds = selectedAddOns.map(addon => addon.id).sort((a, b) => a - b);
      const cartItemId = `${id}-${itemPortion}-${addOnIds.join(',')}`;
      const existingItem = state.items.find(item => item.cartItemId === cartItemId);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          id,
          cartItemId,
          name,
          price: parseFloat(price),
          halfPrice: halfPrice ? parseFloat(halfPrice) : null,
          acPrice: acPrice ? parseFloat(acPrice) : null,
          acHalfPrice: acHalfPrice ? parseFloat(acHalfPrice) : null,
          gstPercent: parseFloat(gstPercent),
          isVeg,
          quantity: 1,
          notes: '',
          portion: itemPortion,
          addOns: selectedAddOns,
          isCombo: isCombo || false,
          comboItems: comboItems || []
        });
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.cartItemId !== action.payload);
    },
    updateQuantity: (state, action) => {
      const { cartItemId, quantity } = action.payload;
      const item = state.items.find(item => item.cartItemId === cartItemId);
      if (item) {
        item.quantity = Math.max(1, parseInt(quantity));
      }
    },
    updateItemNotes: (state, action) => {
      const { cartItemId, notes } = action.payload;
      const item = state.items.find(item => item.cartItemId === cartItemId);
      if (item) {
        item.notes = notes;
      }
    },
    setTable: (state, action) => {
      state.selectedTable = action.payload;
    },
    setCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    applyCoupon: (state, action) => {
      state.coupon = action.payload;
    },
    removeCoupon: (state) => {
      state.coupon = null;
    },
    setOrderType: (state, action) => {
      state.orderType = action.payload;
      if (action.payload !== 'Dine-In') {
        state.selectedTable = null;
      }
    },
    setWaiter: (state, action) => {
      state.waiterName = action.payload;
    },
    loadDraftOrder: (state, action) => {
      const { id, items, table, customer, type, waiterName, coupon } = action.payload;
      state.draftOrderId = id;
      state.orderType = type || 'Dine-In';
      state.selectedTable = table || null;
      state.selectedCustomer = customer || null;
      state.waiterName = waiterName || '';
      state.coupon = coupon || null;
      
      state.items = items.map(dbItem => {
        const menuItem = dbItem.menuItem || {};
        const portion = dbItem.portion || 'Full';
        const addOns = dbItem.addOns ? dbItem.addOns.map(oa => oa.addOn) : [];
        const addOnIds = addOns.map(addon => addon.id).sort((a, b) => a - b);
        const cartItemId = `${dbItem.menuItemId}-${portion}-${addOnIds.join(',')}`;
        
        return {
          id: dbItem.menuItemId,
          cartItemId,
          name: menuItem.name || 'Unknown Item',
          price: parseFloat(dbItem.price),
          halfPrice: menuItem.halfPrice ? parseFloat(menuItem.halfPrice) : null,
          acPrice: menuItem.acPrice ? parseFloat(menuItem.acPrice) : null,
          acHalfPrice: menuItem.acHalfPrice ? parseFloat(menuItem.acHalfPrice) : null,
          gstPercent: parseFloat(dbItem.gstPercent || menuItem.gstPercent || 5),
          isVeg: menuItem.isVeg || false,
          quantity: dbItem.quantity,
          notes: dbItem.notes || '',
          portion,
          addOns,
          isCombo: menuItem.isCombo || false,
          comboItems: dbItem.comboItems || menuItem.comboItems || []
        };
      });
    },
    clearCart: (state) => {
      state.items = [];
      state.selectedTable = null;
      state.selectedCustomer = null;
      state.coupon = null;
      state.orderType = 'Dine-In';
      state.waiterName = '';
      state.draftOrderId = null;
    },
  },
});

export const {
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
  clearCart,
  loadDraftOrder
} = cartSlice.actions;

export default cartSlice.reducer;
