import React, { useState, useEffect } from 'react';
import { Plus, Grid, Edit2, Trash, RefreshCw, Printer, CreditCard, Trash2 } from 'lucide-react';
import API from '../services/api.js';
import Modal from '../components/Modal.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setTable, setOrderType } from '../store/slices/cartSlice.js';
import KOTTimings from '../components/KOTTimings.jsx';
import CancelItemModal from '../components/CancelItemModal.jsx';

const TableTimer = ({ order }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!order || !order.kots || order.kots.length === 0) return;

    const hasActive = order.kots.some(k => k.status !== 'Completed');
    if (!hasActive) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [order]);

  if (!order || !order.kots || order.kots.length === 0) return null;

  const activeKots = order.kots.filter(k => k.status !== 'Completed');

  if (activeKots.length > 0) {
    const earliestStart = Math.min(...activeKots.map(k => new Date(k.createdAt).getTime()));
    const elapsedMs = now - earliestStart;
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return (
      <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-250 dark:border-amber-900/30 ml-1.5 font-mono font-bold animate-pulse">
        {m > 0 ? `${m}m ${s}s` : `${s}s`}
      </span>
    );
  } else {
    const start = Math.min(...order.kots.map(k => new Date(k.createdAt).getTime()));
    const end = Math.max(...order.kots.map(k => new Date(k.updatedAt).getTime()));
    const durationMs = end - start;
    const totalSeconds = Math.floor(durationMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return (
      <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-250 dark:border-emerald-900/30 ml-1.5 font-mono font-bold">
        {m > 0 ? `${m}m ${s}s` : `${s}s`}
      </span>
    );
  }
};

const Tables = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdminOrManager = ['Admin', 'Manager'].includes(user?.role);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleCreateOrder = (table) => {
    dispatch(setTable(table));
    dispatch(setOrderType('Dine-In'));
    navigate('/pos');
  };

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');

  // Edit / Add table modals
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableForm, setTableForm] = useState({ tableNumber: '', capacity: 4, status: 'Available', tableType: 'Non-AC' });

  const [tableCategories, setTableCategories] = useState([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  const fetchTableCategories = async () => {
    try {
      const { data } = await API.get('/tables/categories');
      setTableCategories(data);
    } catch (error) {
      console.error('Error fetching table categories:', error);
    }
  };

  // Merge table modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeForm, setMergeForm] = useState({ sourceTableId: '', targetTableId: '' });

  // Settle bill modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTable, setSettleTable] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAmount, setPaymentAmount] = useState('');

  // Item cancellation modal
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);
  const [cancellationItem, setCancellationItem] = useState(null);

  const fetchTables = async () => {
    try {
      const { data } = await API.get('/tables');
      setTables(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setLoading(false);
    }
  };

  const handleCancellationSuccess = async () => {
    try {
      const { data } = await API.get('/tables');
      setTables(data);
      if (settleTable) {
        const updatedTable = data.find(t => t.id === settleTable.id);
        if (updatedTable) {
          setSettleTable(updatedTable);
          if (updatedTable.orders && updatedTable.orders[0]) {
            const order = updatedTable.orders[0];
            const remaining = (parseFloat(order.totalAmount) - (parseFloat(order.amountPaid) || 0)).toFixed(2);
            setPaymentAmount(remaining);
          } else {
            setShowSettleModal(false);
            setSettleTable(null);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing tables after cancellation:', error);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchTableCategories();
  }, []);

  const handleOpenAdd = () => {
    const defaultType = tableCategories.length > 0 ? tableCategories[0].name : 'Non-AC';
    setTableForm({ tableNumber: '', capacity: 4, status: 'Available', tableType: defaultType });
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleOpenEdit = (table) => {
    setSelectedTable(table);
    setTableForm({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
      tableType: table.tableType || 'Non-AC'
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tableForm.tableNumber) return;

    try {
      if (isEditMode) {
        await API.put(`/tables/${selectedTable.id}`, tableForm);
      } else {
        await API.post('/tables', tableForm);
      }
      setShowModal(false);
      fetchTables();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await API.delete(`/tables/${tableId}`);
      fetchTables();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleMergeSubmit = async (e) => {
    e.preventDefault();
    if (!mergeForm.sourceTableId || !mergeForm.targetTableId) return;
    if (mergeForm.sourceTableId === mergeForm.targetTableId) {
      alert('Source and Target tables cannot be the same');
      return;
    }

    try {
      await API.post('/pos/merge-tables', mergeForm);
      alert('Tables merged successfully');
      setShowMergeModal(false);
      fetchTables();
    } catch (error) {
      alert(error.response?.data?.message || 'Merge failed');
    }
  };

  const getGroupedTables = () => {
    const grouped = {};
    tables.forEach(table => {
      const type = table.tableType || 'Non-AC';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(table);
    });
    return grouped;
  };

  const renderTableCard = (table) => {
    const isOccupied = table.status === 'Occupied';
    const isReserved = table.status === 'Reserved';
    return (
      <div
        key={table.id}
        className={`relative flex flex-col justify-between p-3.5 rounded-xl border-2 shadow-sm bg-white dark:bg-slate-900 transition-all ${
          isOccupied
            ? 'border-rose-500/50 bg-rose-50/10 dark:bg-rose-950/10'
            : isReserved
            ? 'border-amber-500/50 bg-amber-50/10 dark:bg-amber-950/10'
            : 'border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10'
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Grid size={14} />
          </div>
          {isAdminOrManager && (
            <div className="flex gap-1">
              <button
                onClick={() => handleOpenEdit(table)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 dark:hover:bg-slate-800"
              >
                <Edit2 size={10} />
              </button>
              <button
                onClick={() => handleDelete(table.id)}
                className="p-1 hover:bg-red-50 rounded text-red-500 dark:hover:bg-red-950/20"
              >
                <Trash size={10} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-2.5">
          <h4 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
            {table.tableNumber}
            {table.tableType && table.tableType !== 'Non-AC' && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-900/40">
                {table.tableType}
              </span>
            )}
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Capacity: {table.capacity} Seats</p>
          {isOccupied && table.orders && table.orders[0] && (
            <>
              <div className="mt-1.5 text-[10px] flex items-center flex-wrap gap-y-0.5">
                <span className="text-slate-400 dark:text-slate-500">Order: </span>
                <span className={`font-semibold ${
                  table.orders[0].status === 'Preparing' ? 'text-indigo-600 dark:text-indigo-400' :
                  table.orders[0].status === 'Served' ? 'text-emerald-600 dark:text-emerald-455' :
                  'text-amber-600 dark:text-amber-400'
                }`}>
                  {table.orders[0].status}
                </span>
                <TableTimer order={table.orders[0]} />
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-0.5 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-slate-500">Total Amount:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Rs. {parseFloat(table.orders[0].totalAmount).toFixed(2)}
                  </span>
                </div>
                {table.orders[0].paymentStatus === 'Partially-Paid' && (
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-medium">
                    <span>Paid:</span>
                    <span>Rs. {parseFloat(table.orders[0].amountPaid).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex justify-end items-center gap-1.5">
          <div className="flex items-center gap-1">
            {(table.status === 'Available' || table.status === 'Occupied') && (
              <button
                onClick={() => handleCreateOrder(table)}
                title={isOccupied ? 'Add Items / KOT' : 'Create New Order'}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all ${
                  isOccupied
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-955/20 dark:border-indigo-900/30 dark:text-amber-400'
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                }`}
              >
                <Plus size={8} />
                <span>{isOccupied ? 'Add' : 'Order'}</span>
              </button>
            )}

            {isOccupied && table.orders && table.orders[0] && (
              <button
                onClick={() => {
                  setSettleTable(table);
                  setPaymentMethod('Cash');
                  const remaining = (parseFloat(table.orders[0].totalAmount) - (parseFloat(table.orders[0].amountPaid) || 0)).toFixed(2);
                  setPaymentAmount(remaining);
                  setShowSettleModal(true);
                }}
                title="Settle Bill"
                className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 rounded-md flex items-center gap-1 transition-all"
              >
                <CreditCard size={8} />
                <span>Settle</span>
              </button>
            )}
          </div>
        </div>

        {isOccupied && table.orders && table.orders[0] && (
          <div
            id={`print-receipt-${table.orders[0].id}`}
            className="hidden print:block w-[80mm] text-slate-900 bg-white p-4 font-mono text-[11px] leading-relaxed mx-auto text-left"
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
              <p>Bill: {table.orders[0].orderNumber}</p>
              <p>Date: {new Date(table.orders[0].createdAt).toLocaleDateString()} {new Date(table.orders[0].createdAt).toLocaleTimeString()}</p>
              <p>Type: {table.orders[0].type} (Table: {table.tableNumber})</p>
              {table.orders[0].customer && <p>Customer: {table.orders[0].customer.name}</p>}
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
                {table.orders[0].items && table.orders[0].items
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
                <span>Rs. {parseFloat(table.orders[0].subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Amt:</span>
                <span>Rs. {parseFloat(table.orders[0].gstAmount).toFixed(2)}</span>
              </div>
              {table.orders[0].discount > 0 && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Discount:</span>
                  <span>-Rs. {parseFloat(table.orders[0].discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-dashed border-slate-900 pt-1 font-bold text-sm">
                <span>Net Payable:</span>
                <span>Rs. {parseFloat(table.orders[0].totalAmount).toFixed(2)}</span>
              </div>
              {parseFloat(table.orders[0].amountPaid) > 0 && (
                <>
                  <div className="flex justify-between font-bold">
                    <span>Amount Paid:</span>
                    <span>Rs. {parseFloat(table.orders[0].amountPaid).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-900 pt-1 font-bold text-sm">
                    <span>Balance Due:</span>
                    <span>Rs. {(parseFloat(table.orders[0].totalAmount) - parseFloat(table.orders[0].amountPaid)).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="text-center font-bold border-t border-dashed border-slate-900 pt-3 mt-3 text-xs">
              *** Thank You! Visit Again ***
            </div>
          </div>
        )}
      </div>
    );
  };

  const handlePrint = (order) => {
    const printContent = document.getElementById(`print-receipt-${order.id}`);
    if (printContent) {
      document.body.innerHTML = printContent.outerHTML;
      window.print();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Table Layout Status</h2>
          <p className="text-sm text-slate-500 mt-1">Monitor real-time occupancy status and seat assignments.</p>
        </div>
        <div className="flex gap-2">
          {isAdminOrManager && (
            <>
              <button
                onClick={() => setShowMergeModal(true)}
                className="bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400"
              >
                Merge Table
              </button>
              <button
                onClick={() => setShowCategoryManager(true)}
                className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              >
                Categories
              </button>
              <button
                onClick={handleOpenAdd}
                className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
              >
                <Plus size={16} /> Add Table
              </button>
            </>
          )}
          <button
            onClick={fetchTables}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Category Tab Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2.5 mb-4 border-b border-slate-100 dark:border-slate-800 scrollbar-thin">
        <button
          onClick={() => setSelectedCategoryTab('All')}
          className={`rounded-full px-5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategoryTab === 'All'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          All Categories
        </button>
        {tableCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryTab(cat.name)}
            className={`rounded-full px-5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryTab === cat.name
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Syncing table maps...</div>
      ) : tables.length === 0 ? (
        <div className="text-center py-10 text-slate-400">No tables created yet.</div>
      ) : selectedCategoryTab === 'All' ? (
        <div className="space-y-8">
          {Object.entries(getGroupedTables()).map(([categoryName, catTables]) => (
            <div key={categoryName} className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                  {categoryName} Seating
                </h3>
                <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/50">
                  {catTables.length} {catTables.length === 1 ? 'Table' : 'Tables'}
                </span>
              </div>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {catTables.map(renderTableCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
              {selectedCategoryTab} Seating
            </h3>
            <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/50">
              {tables.filter(t => t.tableType === selectedCategoryTab).length} {tables.filter(t => t.tableType === selectedCategoryTab).length === 1 ? 'Table' : 'Tables'}
            </span>
          </div>
          {tables.filter(t => t.tableType === selectedCategoryTab).length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">No tables in this category.</div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {tables.filter(t => t.tableType === selectedCategoryTab).map(renderTableCard)}
            </div>
          )}
        </div>
      )}

      {/* Edit/Add Table modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditMode ? 'Modify Seating Table' : 'Add New Dining Table'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-505">Table Number / Label</label>
            <input
              type="text"
              required
              placeholder="e.g. T-11"
              value={tableForm.tableNumber}
              onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-505">Capacity (Seats count)</label>
            <input
              type="number"
              min="1"
              required
              value={tableForm.capacity}
              onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) })}
              className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-505">Initial Status</label>
            <select
              value={tableForm.status}
              onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900"
            >
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Reserved">Reserved</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-505">Table Type</label>
            <select
              value={tableForm.tableType}
              onChange={(e) => setTableForm({ ...tableForm, tableType: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
            >
              {tableCategories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
              {tableCategories.length === 0 && (
                <>
                  <option value="Non-AC">Non-AC</option>
                  <option value="AC">AC</option>
                </>
              )}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2"
          >
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Merge table modal */}
      <Modal isOpen={showMergeModal} onClose={() => setShowMergeModal(false)} title="Merge Seating Tables">
        <form onSubmit={handleMergeSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-505">Source Table (Unpaid Order Source)</label>
            <select
              required
              value={mergeForm.sourceTableId}
              onChange={(e) => setMergeForm({ ...mergeForm, sourceTableId: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900"
            >
              <option value="">Select occupied source table...</option>
              {tables.filter(t => t.status === 'Occupied').map(t => (
                <option key={t.id} value={t.id}>{t.tableNumber} (Occupied)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-505">Target Destination Table</label>
            <select
              required
              value={mergeForm.targetTableId}
              onChange={(e) => setMergeForm({ ...mergeForm, targetTableId: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50 dark:bg-slate-900"
            >
              <option value="">Select target table...</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.tableNumber} ({t.status})</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-brand-650 text-white font-bold py-3 rounded-lg hover:bg-brand-700 mt-2"
          >
            Execute Merge
          </button>
        </form>
      </Modal>

      {/* Table Category Manager Modal */}
      <Modal isOpen={showCategoryManager} onClose={() => setShowCategoryManager(false)} title="Manage Table Categories">
        <div className="space-y-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newCategoryName) return;
              try {
                await API.post('/tables/categories', { name: newCategoryName, description: newCategoryDesc });
                setNewCategoryName('');
                setNewCategoryDesc('');
                fetchTableCategories();
              } catch (error) {
                alert(error.response?.data?.message || 'Failed to create category');
              }
            }}
            className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Create New Category</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-450 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garden"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-450 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Outdoor garden area"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 rounded-lg text-xs"
            >
              Add Category
            </button>
          </form>

          <div>
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">Existing Categories</h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              {tableCategories.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center p-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white">{cat.name}</span>
                    {cat.description && <p className="text-[10px] text-slate-400 mt-0.5">{cat.description}</p>}
                  </div>
                  {['Non-AC', 'AC'].includes(cat.name) ? (
                    <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold">System</span>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Delete the "${cat.name}" category?`)) return;
                        try {
                          await API.delete(`/tables/categories/${cat.id}`);
                          fetchTableCategories();
                        } catch (error) {
                          alert(error.response?.data?.message || 'Delete failed');
                        }
                      }}
                      className="text-rose-500 hover:text-rose-650 hover:bg-rose-50 p-1 rounded"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              ))}
              {tableCategories.length === 0 && (
                <p className="text-center p-4 text-slate-400">No categories defined.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Settle Bill modal */}
      <Modal
        isOpen={showSettleModal}
        onClose={() => {
          setShowSettleModal(false);
          setSettleTable(null);
        }}
        title={`Settle Bill - Table ${settleTable?.tableNumber}`}
      >
        {settleTable && settleTable.orders && settleTable.orders[0] && (
          <div className="space-y-5">
            {/* Order details header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-3">
              <div>
                <p className="text-[10px] font-semibold text-slate-450 uppercase">Order Number</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                  {settleTable.orders[0].orderNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-slate-450 uppercase">Waiter / Cashier</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                  {settleTable.orders[0].waiterName || 'Staff'}
                </p>
              </div>
            </div>

            {/* Order items list */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Ordered Items</p>
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {settleTable.orders[0].items && settleTable.orders[0].items.map((item) => {
                  const activeQty = item.quantity - (item.cancelledQuantity || 0);
                  const canCancel = settleTable.orders[0].status !== 'Completed' && settleTable.orders[0].status !== 'Cancelled';
                  return (
                    <div key={item.id} className="flex justify-between items-center p-3 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-800 dark:text-white">
                            {item.menuItem?.name}
                          </p>
                          {item.portion === 'Half' && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-400">
                              Half
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">
                            Note: {item.notes}
                          </p>
                        )}
                        {item.cancelledQuantity > 0 && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                            ({item.cancelledQuantity} Cancelled: {item.cancelReason || 'Requested'} by {item.cancelledBy || 'Staff'})
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-medium text-slate-400">
                            {activeQty} x Rs. {parseFloat(item.price).toFixed(2)}
                          </span>
                          {item.cancelledQuantity > 0 && (
                            <span className="text-[9px] text-slate-500 block font-normal">(of {item.quantity})</span>
                          )}
                        </div>
                        <span className="font-bold text-slate-805 dark:text-slate-200 min-w-[70px] text-right">
                          Rs. {(parseFloat(item.price) * activeQty).toFixed(2)}
                        </span>
                        {canCancel && (
                          <div className="min-w-[24px]">
                            {activeQty > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancellationItem(item);
                                  setShowCancelItemModal(true);
                                }}
                                className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded inline-flex animate-pulse"
                                title="Cancel Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <span className="text-[9px] text-rose-500 font-bold">Cancelled</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* KOT Timings */}
            <KOTTimings kots={settleTable.orders[0].kots} />

            {/* Receipt Summary */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Subtotal</span>
                <span>Rs. {parseFloat(settleTable.orders[0].subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-505">
                <span>GST Amount</span>
                <span>Rs. {parseFloat(settleTable.orders[0].gstAmount).toFixed(2)}</span>
              </div>
              {parseFloat(settleTable.orders[0].discount) > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-600">
                  <span>Discount</span>
                  <span>-Rs. {parseFloat(settleTable.orders[0].discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total Payable</span>
                <span>Rs. {parseFloat(settleTable.orders[0].totalAmount).toFixed(2)}</span>
              </div>
              {parseFloat(settleTable.orders[0].amountPaid) > 0 && (
                <div className="flex justify-between text-xs font-medium text-emerald-500">
                  <span>Paid So Far</span>
                  <span>Rs. {parseFloat(settleTable.orders[0].amountPaid).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-800 dark:text-white pt-1">
                <span>Remaining Balance</span>
                <span>Rs. {(parseFloat(settleTable.orders[0].totalAmount) - (parseFloat(settleTable.orders[0].amountPaid) || 0)).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Amount Input */}
            <div>
              <label className="text-xs font-semibold text-slate-500">Payment Amount (Rs.)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={(parseFloat(settleTable.orders[0].totalAmount) - (parseFloat(settleTable.orders[0].amountPaid) || 0)).toFixed(2)}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-white text-sm"
              />
            </div>

            {/* Payment method selector */}
            <div>
              <label className="text-xs font-semibold text-slate-500">Payment Channel</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['Cash', 'Card', 'UPI'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${
                      paymentMethod === method
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkout CTA */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handlePrint(settleTable.orders[0]);
                }}
                className="flex-1 py-3 border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 transition-all"
              >
                <Printer size={14} /> Print Bill
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const orderId = settleTable.orders[0].id;
                    const amountToPay = parseFloat(paymentAmount);
                    if (isNaN(amountToPay) || amountToPay <= 0) {
                      alert('Please enter a valid payment amount');
                      return;
                    }
                    
                    const remaining = parseFloat(settleTable.orders[0].totalAmount) - (parseFloat(settleTable.orders[0].amountPaid) || 0);
                    if (amountToPay > remaining + 0.01) {
                      alert(`Payment amount cannot exceed the remaining balance of Rs. ${remaining.toFixed(2)}`);
                      return;
                    }

                    await API.post(`/pos/orders/${orderId}/checkout`, {
                      paymentMethod: paymentMethod,
                      amountPaid: amountToPay
                    });
                    
                    const isFullyPaid = (parseFloat(settleTable.orders[0].amountPaid || 0) + amountToPay) >= parseFloat(settleTable.orders[0].totalAmount);
                    
                    alert(isFullyPaid ? 'Order settled successfully!' : `Partial payment of Rs. ${amountToPay.toFixed(2)} recorded!`);
                    setShowSettleModal(false);
                    setSettleTable(null);
                    fetchTables(); // Refresh tables view
                  } catch (error) {
                    alert(error.response?.data?.message || 'Settlement failed');
                  }
                }}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 font-bold py-3 rounded-xl shadow-md text-xs flex justify-center items-center gap-1.5 transition-all"
              >
                <CreditCard size={14} /> Settle & Checkout
              </button>
            </div>
          </div>
        )}
      </Modal>

      <CancelItemModal
        isOpen={showCancelItemModal}
        onClose={() => {
          setShowCancelItemModal(false);
          setCancellationItem(null);
        }}
        orderId={settleTable?.orders?.[0]?.id}
        item={cancellationItem}
        onSuccess={handleCancellationSuccess}
      />

    </div>
  );
};

export default Tables;
