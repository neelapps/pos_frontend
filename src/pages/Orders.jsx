import React, { useState, useEffect } from 'react';
import { Eye, CreditCard, Printer, Search, RefreshCw, X, Trash2, CookingPot, Edit2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadDraftOrder } from '../store/slices/cartSlice.js';
import API from '../services/api.js';
import Modal from '../components/Modal.jsx';
import KOTTimings from '../components/KOTTimings.jsx';
import CancelItemModal from '../components/CancelItemModal.jsx';

const Orders = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleEditDraft = async (orderId) => {
    try {
      const { data } = await API.get(`/pos/orders/${orderId}`);
      dispatch(loadDraftOrder(data));
      navigate('/pos');
    } catch (error) {
      alert('Error loading draft details');
    }
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Selected order details modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('Cash');
  const [checkoutAmount, setCheckoutAmount] = useState('');

  // Item cancellation modal
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);
  const [cancellationItem, setCancellationItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = '/pos/orders?limit=100';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (typeFilter) url += `&type=${typeFilter}`;

      const { data } = await API.get(url);
      setOrders(data.orders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, typeFilter]);

  const handleViewOrder = async (orderId) => {
    try {
      const { data } = await API.get(`/pos/orders/${orderId}`);
      setSelectedOrder(data);
      setShowDetailsModal(true);
    } catch (error) {
      alert('Error fetching order details');
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedOrder) return;
    const amountToPay = parseFloat(checkoutAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const remaining = parseFloat(selectedOrder.totalAmount) - (parseFloat(selectedOrder.amountPaid) || 0);
    if (amountToPay > remaining + 0.01) {
      alert(`Payment amount cannot exceed the remaining balance of Rs. ${remaining.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await API.post(`/pos/orders/${selectedOrder.id}/checkout`, {
        paymentMethod: checkoutPaymentMethod,
        amountPaid: amountToPay
      });
      
      const isFullyPaid = (parseFloat(selectedOrder.amountPaid || 0) + amountToPay) >= parseFloat(selectedOrder.totalAmount);
      alert(isFullyPaid ? 'Checkout successful!' : `Partial payment of Rs. ${amountToPay.toFixed(2)} recorded!`);
      
      setShowCheckoutModal(false);
      setShowDetailsModal(false);
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateOrder = async (orderId) => {
    if (!window.confirm('Send KOT to kitchen and activate this draft order?')) return;
    setIsSubmitting(true);
    try {
      await API.post(`/pos/orders/${orderId}/activate`);
      alert('KOT generated and order sent to kitchen!');
      setShowDetailsModal(false);
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Activation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* const handlePrint = (order) => {
    const printContent = document.getElementById(`print-receipt-${order.id}`);
    if (printContent) {
      document.body.innerHTML = printContent.outerHTML;
      window.print();
      window.location.reload();
    }
  }; */

  const handlePrint = (order) => {
  const content = document.getElementById(
    `print-receipt-${order.id}`
  )?.outerHTML;

  if (content) {
    alert(window.electron)
    window.electron.silentPrint(content);
  }
};

  // Filter orders locally by search query (Order number or customer phone)
  const filteredOrders = orders.filter((ord) => {
    const ordNum = ord.orderNumber.toLowerCase();
    const phone = ord.customer?.phone || '';
    const name = ord.customer?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return ordNum.includes(query) || phone.includes(query) || name.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Orders Log</h2>
          <p className="text-sm text-slate-500 mt-1">Search and view details of all order logs.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Search & Filter tools */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Order No. or Customer phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-transparent focus:outline-none text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Served">Served</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-transparent focus:outline-none text-sm"
          >
            <option value="">All Types</option>
            <option value="Dine-In">Dine-In</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Delivery">Delivery</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center py-10">Fetching logs...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Order No.</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Table</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Order Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-6 text-center text-slate-500">
                    No orders matching search filters found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 font-bold text-slate-850 dark:text-white">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3.5">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">{ord.type}</td>
                    <td className="py-3.5">{ord.table?.tableNumber || '-'}</td>
                    <td className="py-3.5">{ord.customer?.name || 'Walk-in'}</td>
                    <td className="py-3.5 font-bold text-slate-850 dark:text-white">
                      Rs. {parseFloat(ord.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          ord.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : ord.paymentStatus === 'Partially-Paid'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          ord.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : ord.status === 'Cancelled'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                            : ord.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                        }`}
                      >
                        {ord.status === 'Pending' ? 'Draft' : ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        {ord.status === 'Pending' && (
                          <>
                            <button
                              disabled={isSubmitting}
                              onClick={() => handleEditDraft(ord.id)}
                              title="Edit/Resume Draft"
                              className="p-1.5 bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100 rounded-lg dark:bg-amber-955/20 dark:border-amber-900/30 dark:text-amber-400 disabled:opacity-50"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              disabled={isSubmitting}
                              onClick={() => handleActivateOrder(ord.id)}
                              title="Send KOT to Kitchen"
                              className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-750 hover:bg-indigo-100 rounded-lg dark:bg-indigo-950/40 dark:border-indigo-900/30 dark:text-indigo-450 disabled:opacity-50"
                            >
                              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <CookingPot size={14} />}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewOrder(ord.id)}
                          className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Order Details: ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-400">Order Number</span>
                <p className="font-bold text-sm text-slate-800 dark:text-white mt-0.5">{selectedOrder.orderNumber}</p>
              </div>
              <div>
                <span className="text-slate-400">Status</span>
                <div className="mt-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      selectedOrder.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : selectedOrder.status === 'Cancelled'
                        ? 'bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-450'
                        : selectedOrder.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                    }`}
                  >
                    {selectedOrder.status === 'Pending' ? 'Draft' : selectedOrder.status}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-400">Order Type</span>
                <p className="font-bold text-sm text-slate-800 dark:text-white mt-0.5">{selectedOrder.type}</p>
              </div>
              <div>
                <span className="text-slate-400">Table Number</span>
                <p className="font-bold text-sm text-slate-800 dark:text-white mt-0.5">{selectedOrder.table?.tableNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Customer Details</span>
                <p className="font-bold text-sm text-slate-800 dark:text-white mt-0.5">{selectedOrder.customer?.name || 'Walk-in'}</p>
              </div>
            </div>

            {/* Line items list */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Order Items</h4>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2">Menu Item</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Total</th>
                    {selectedOrder.status !== 'Completed' && selectedOrder.status !== 'Cancelled' && (
                      <th className="pb-2 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                  {selectedOrder.items.map((it) => {
                    const activeQty = it.quantity - (it.cancelledQuantity || 0);
                    const canCancel = selectedOrder.status !== 'Completed' && selectedOrder.status !== 'Cancelled';
                    return (
                      <tr key={it.id}>
                        <td className="py-2.5 font-medium text-slate-850 dark:text-white">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{it.menuItem?.name}</span>
                            {it.portion === 'Half' && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-400">
                                Half
                              </span>
                            )}
                          </div>
                          {it.notes && <span className="block text-[10px] text-slate-400">Note: {it.notes}</span>}
                          {it.cancelledQuantity > 0 && (
                            <span className="block text-[10px] text-rose-500 font-semibold mt-0.5">
                              ({it.cancelledQuantity} Cancelled: {it.cancelReason || 'Requested'} by {it.cancelledBy || 'Staff'})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          {activeQty}
                          {it.cancelledQuantity > 0 && (
                            <span className="text-[10px] text-slate-400 block font-normal">(of {it.quantity})</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">Rs. {parseFloat(it.price).toFixed(2)}</td>
                        <td className="py-2.5 text-right font-semibold">Rs. {(parseFloat(it.price) * activeQty).toFixed(2)}</td>
                        {canCancel && (
                          <td className="py-2.5 text-right">
                            {activeQty > 0 ? (
                              <button
                                onClick={() => {
                                  setCancellationItem(it);
                                  setShowCancelItemModal(true);
                                }}
                                className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded inline-flex"
                                title="Cancel Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <span className="text-[10px] text-rose-500 italic font-semibold">Cancelled</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* KOT Timings */}
            <KOTTimings kots={selectedOrder.kots} />

            {/* Calculations Breakdown */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rs. {parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Amount</span>
                  <span>Rs. {parseFloat(selectedOrder.gstAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-Rs. {parseFloat(selectedOrder.discount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-800 dark:text-white font-bold text-sm border-t border-slate-100 dark:border-slate-800 pt-1.5">
                  <span>Grand Total</span>
                  <span>Rs. {parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
                {parseFloat(selectedOrder.amountPaid) > 0 && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>Paid So Far</span>
                    <span>Rs. {parseFloat(selectedOrder.amountPaid).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 dark:text-slate-200 font-semibold border-t border-slate-100 dark:border-slate-800 pt-1">
                  <span>Remaining Due</span>
                  <span>Rs. {(parseFloat(selectedOrder.totalAmount) - (parseFloat(selectedOrder.amountPaid) || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Print and Checkout Options */}
            <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
              <button
                disabled={isSubmitting}
                onClick={() => handlePrint(selectedOrder)}
                className="flex items-center gap-2 border border-slate-200 dark:border-slate-770 px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                <Printer size={14} /> Print Receipt
              </button>

              <div className="flex gap-2">
                {selectedOrder.status === 'Pending' && (
                  <>
                    <button
                      disabled={isSubmitting}
                      onClick={() => {
                        handleEditDraft(selectedOrder.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <Edit2 size={14} /> Edit Draft
                    </button>
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleActivateOrder(selectedOrder.id)}
                      className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all expired-hide disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : null}
                      <span>Send KOT to Kitchen</span>
                    </button>
                  </>
                )}

                {selectedOrder.paymentStatus !== 'Paid' && (
                  <button
                    disabled={isSubmitting}
                    onClick={() => {
                      const remaining = (parseFloat(selectedOrder.totalAmount) - (parseFloat(selectedOrder.amountPaid) || 0)).toFixed(2);
                      setCheckoutAmount(remaining);
                      setShowCheckoutModal(true);
                    }}
                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                  >
                    <CreditCard size={14} /> Checkout Pay
                  </button>
                )}
              </div>
            </div>

            {/* Embedded Receipt (Hidden but targetable for system printing) */}
            <div
              id={`print-receipt-${selectedOrder.id}`}
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
                <p>Bill: {selectedOrder.orderNumber}</p>
                <p>Date: {new Date(selectedOrder.createdAt).toLocaleDateString()} {new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                <p>Type: {selectedOrder.type} {selectedOrder.table ? `(Table: ${selectedOrder.table.tableNumber})` : ''}</p>
                {selectedOrder.customer && <p>Customer: {selectedOrder.customer.name}</p>}
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
                  {selectedOrder.items && selectedOrder.items
                    .map((item) => {
                      const activeQty = item.quantity - (item.cancelledQuantity || 0);
                      return { ...item, activeQty };
                    })
                    .filter((item) => item.activeQty > 0)
                    .map((item) => (
                      <tr key={item.id}>
                        <td className="py-1">
                          {item.menuItem?.name}
                          {item.portion === 'Half' ? ' (Half)' : ''}
                        </td>
                        <td className="py-1 text-center">{item.activeQty}</td>
                        <td className="py-1 text-right">Rs. {(item.price * item.activeQty).toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="border-t border-dashed border-slate-900 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Amt:</span>
                  <span>Rs. {parseFloat(selectedOrder.gstAmount).toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Discount:</span>
                    <span>-Rs. {parseFloat(selectedOrder.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed border-slate-900 pt-1 font-bold text-sm">
                  <span>Net Payable:</span>
                  <span>Rs. {parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
                {parseFloat(selectedOrder.amountPaid) > 0 && (
                  <>
                    <div className="flex justify-between font-bold">
                      <span>Amount Paid:</span>
                      <span>Rs. {parseFloat(selectedOrder.amountPaid).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-slate-900 pt-1 font-bold text-sm">
                      <span>Balance Due:</span>
                      <span>Rs. {(parseFloat(selectedOrder.totalAmount) - parseFloat(selectedOrder.amountPaid)).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="text-center font-bold border-t border-dashed border-slate-900 pt-3 mt-3">
                *** Thank You! Visit Again ***
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* Checkout Pay method selector modal */}
      <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Checkout Order">
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl dark:bg-slate-950 text-center space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Grand Total</span>
              <span>Rs. {selectedOrder ? parseFloat(selectedOrder.totalAmount).toFixed(2) : '0.00'}</span>
            </div>
            {selectedOrder && parseFloat(selectedOrder.amountPaid) > 0 && (
              <div className="flex justify-between text-xs font-medium text-emerald-500">
                <span>Paid So Far</span>
                <span>Rs. {parseFloat(selectedOrder.amountPaid).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-800 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-800">
              <span>Remaining Balance</span>
              <span>Rs. {selectedOrder ? (parseFloat(selectedOrder.totalAmount) - (parseFloat(selectedOrder.amountPaid) || 0)).toFixed(2) : '0.00'}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Payment Amount (Rs.)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={selectedOrder ? (parseFloat(selectedOrder.totalAmount) - (parseFloat(selectedOrder.amountPaid) || 0)).toFixed(2) : '0.00'}
              required
              value={checkoutAmount}
              onChange={(e) => setCheckoutAmount(e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-550">Choose Settlement Channel</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {['Cash', 'Card', 'UPI'].map((method) => (
                <button
                  key={method}
                  onClick={() => setCheckoutPaymentMethod(method)}
                  className={`py-2.5 rounded-lg border font-bold text-xs transition-all ${
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
          <button
            disabled={isSubmitting}
            onClick={handleCheckoutSubmit}
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-4 expired-hide disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
            <span>Submit Settlement Payment</span>
          </button>
        </div>
      </Modal>

      <CancelItemModal
        isOpen={showCancelItemModal}
        onClose={() => {
          setShowCancelItemModal(false);
          setCancellationItem(null);
        }}
        orderId={selectedOrder?.id}
        item={cancellationItem}
        onSuccess={() => {
          handleViewOrder(selectedOrder.id);
          fetchOrders();
        }}
      />

    </div>
  );
};

export default Orders;
