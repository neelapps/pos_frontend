import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { CookingPot, Check, AlertCircle, RefreshCw, Clock, Loader2 } from 'lucide-react';
import API from '../services/api.js';

const KOTManagement = () => {
  const socket = useSocket();
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchKots = async () => {
    try {
      const { data } = await API.get('/pos/kots/active');
      setKots(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching KOTs:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKots();

    // Setup elapsed time ticker
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Socket event listener
  useEffect(() => {
    if (socket) {
      // Refresh list on new KOT
      socket.on('kot:new', () => {
        fetchKots();
        // Play notification ding if browser permissions allow
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
          audio.volume = 0.5;
          audio.play();
        } catch (e) {
          console.log('Audio alert blocked by browser autoplay rules');
        }
      });

      socket.on('kot:status_change', () => {
        fetchKots();
      });

      return () => {
        socket.off('kot:new');
        socket.off('kot:status_change');
      };
    }
  }, [socket]);

  const handleUpdateStatus = async (kotId, currentStatus) => {
    const nextStatus = currentStatus === 'New' ? 'Preparing' : 'Completed';
    setIsSubmitting(true);
    try {
      await API.put(`/pos/kots/${kotId}/status`, { status: nextStatus });
      fetchKots();
    } catch (error) {
      alert('Failed to update KOT status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: Calculate elapsed minutes between KOT creation and now
  const getElapsedTime = (createdAtString) => {
    const created = new Date(createdAtString);
    const diffMs = currentTime - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}m ${diffSecs}s`;
  };

  const getAlertColor = (createdAtString) => {
    const created = new Date(createdAtString);
    const diffMins = Math.floor((currentTime - created) / 60000);
    if (diffMins >= 15) return 'text-red-500 border-red-500 bg-red-50 dark:bg-red-950/20';
    if (diffMins >= 8) return 'text-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-950/20';
    return 'text-slate-500 border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
            <CookingPot className="text-brand-500" />
            Kitchen Order Display (KOT)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Realtime orders list. Complete KOTs to notify wait staff.
          </p>
        </div>
        <button
          onClick={fetchKots}
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Connecting to display feed...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kots.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <CookingPot size={48} className="text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
              <p className="font-semibold text-slate-500">No active kitchen tickets</p>
              <p className="text-xs text-slate-400 mt-1">New POS orders will appear here automatically.</p>
            </div>
          ) : (
            kots.map((kot) => {
              const cardAlert = getAlertColor(kot.createdAt);
              return (
                <div
                  key={kot.id}
                  className={`flex flex-col justify-between border-2 rounded-2xl p-5 shadow-sm bg-white dark:bg-slate-900 transition-all ${
                    kot.status === 'New' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                          {kot.kotNumber}
                        </span>
                        <h4 className="font-extrabold text-base text-slate-800 dark:text-white mt-0.5">
                          {kot.order?.type} {kot.order?.table ? `- ${kot.order.table.tableNumber}` : ''}
                        </h4>
                      </div>
                      <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border ${cardAlert}`}>
                        <Clock size={12} />
                        {getElapsedTime(kot.createdAt)}
                      </div>
                    </div>

                    {/* Items table list */}
                    <div className="space-y-3">
                      {kot.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px]">{it.menuItem?.isVeg ? '🟢' : '🔴'}</span>
                              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                {it.menuItem?.name}
                              </span>
                              {it.portion === 'Half' && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-400">
                                  Half
                                </span>
                              )}
                            </div>
                            {it.notes && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded mt-1 font-medium italic border border-amber-100 dark:border-amber-900/30">
                                Note: {it.notes}
                              </p>
                            )}
                          </div>
                          <span className="font-extrabold text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                            x{it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleUpdateStatus(kot.id, kot.status)}
                      className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all shadow-sm expired-hide disabled:opacity-50 ${
                        kot.status === 'New'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : kot.status === 'New' ? (
                        <CookingPot size={16} />
                      ) : (
                        <Check size={16} />
                      )}
                      <span>{kot.status === 'New' ? 'Start Preparing' : 'Mark as Ready'}</span>
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default KOTManagement;
