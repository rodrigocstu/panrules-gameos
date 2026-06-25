import { Search } from 'lucide-react';

// Modal de detalle de un registro de tráfico. Devuelve null si no hay log.
export default function LogModal({ log, onClose }) {
  if (!log) return null;

  return (
    <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg shadow-2xl border border-slate-600 w-full max-w-2xl overflow-hidden">
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Search size={18} className="text-orange-500" /> Traffic Log Detail
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            Close
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6 text-sm font-mono">
          <div className="space-y-2">
            <div className="text-slate-500 text-xs uppercase">Source</div>
            <div className="text-emerald-400 text-lg">{log.src}</div>
          </div>
          <div className="space-y-2">
            <div className="text-slate-500 text-xs uppercase">Destination</div>
            <div className="text-blue-400 text-lg">{log.dst}</div>
          </div>
          <div className="col-span-2 border-t border-slate-700 pt-4 space-y-2">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-slate-500 text-xs">App</div>
                <div className="text-purple-400">{log.app}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Action</div>
                <div className={log.action === 'ALLOW' ? 'text-green-500' : 'text-red-500'}>
                  {log.action}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Bytes</div>
                <div className="text-white">{log.bytes}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Flags</div>
                <div className="text-white">{log.flags}</div>
              </div>
            </div>
          </div>
          <div className="col-span-2 bg-black/30 p-3 rounded border border-slate-700">
            <div className="text-slate-500 text-xs mb-1">Reason</div>
            <div className="text-orange-300">{log.reason}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
