import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Play } from 'lucide-react';

const formatDuration = (ms) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const KOTRow = ({ kot, now }) => {
  const isCompleted = kot.status === 'Completed';
  const start = new Date(kot.createdAt).getTime();
  const end = isCompleted ? new Date(kot.updatedAt).getTime() : now;
  const durationMs = end - start;

  // Status style maps
  const statusStyles = {
    New: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
    Preparing: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
  };

  const getStatusIcon = () => {
    switch (kot.status) {
      case 'Completed':
        return <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />;
      case 'Preparing':
        return <Play size={13} className="text-amber-600 dark:text-amber-400 animate-pulse" />;
      default:
        return <AlertCircle size={13} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="flex flex-col p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
            {kot.kotNumber}
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusStyles[kot.status]}`}>
            {getStatusIcon()}
            {kot.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-650 dark:text-slate-350">
          <Clock size={12} className={!isCompleted ? 'animate-spin [animation-duration:8s]' : ''} />
          <span>
            {isCompleted ? 'Served in: ' : 'Elapsed: '}
            <span className={`font-bold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100 font-mono'}`}>
              {formatDuration(durationMs)}
            </span>
          </span>
        </div>
      </div>

      {/* KOT items inside */}
      <div className="pl-2 border-l border-slate-100 dark:border-slate-800 space-y-1 mt-1">
        {kot.items && kot.items.map((item) => (
          <div key={item.id} className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {item.menuItem?.name} {item.notes && <span className="text-[10px] text-slate-450 italic">({item.notes})</span>}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Qty: {item.quantity}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 text-[10px] text-slate-400 text-right">
        Created: {new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
    </div>
  );
};

const KOTTimings = ({ kots }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const hasActiveKots = kots?.some(kot => kot.status !== 'Completed');
    if (!hasActiveKots) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [kots]);

  if (!kots || kots.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-slate-400 italic">
        No Kitchen Order Tickets (KOT) generated for this order yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">KOT Timings & Status</p>
      <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
        {kots.map((kot) => (
          <KOTRow key={kot.id} kot={kot} now={now} />
        ))}
      </div>
    </div>
  );
};

export default KOTTimings;
