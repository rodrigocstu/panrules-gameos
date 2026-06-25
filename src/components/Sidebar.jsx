import { Activity, Lock, Globe } from 'lucide-react';

// Barra lateral: navegación del dashboard + ticket del incidente actual.
export default function Sidebar({ levelIdx, level }) {
  return (
    <div className="col-span-2 bg-slate-900 border-r border-slate-800 flex flex-col py-4 z-40">
      <div className="px-4 mb-6">
        <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
          Dashboard
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-300 bg-slate-800 px-3 py-2 rounded cursor-pointer border-l-2 border-orange-500">
            <Activity size={14} /> Monitor
          </div>
          <div className="flex items-center gap-2 text-slate-400 px-3 py-2 hover:text-slate-200 cursor-pointer">
            <Lock size={14} /> Policies
          </div>
          <div className="flex items-center gap-2 text-slate-400 px-3 py-2 hover:text-slate-200 cursor-pointer">
            <Globe size={14} /> Network
          </div>
        </div>
      </div>
      <div className="px-4 mt-auto">
        <div className="bg-slate-800 rounded p-3 border border-slate-700">
          <h3 className="text-xs font-bold text-orange-500 mb-1">Incident #{2040 + levelIdx}</h3>
          <p className="text-[10px] text-slate-400 leading-tight mb-2">{level.desc}</p>
          <div className="pt-2 border-t border-slate-700 grid grid-cols-1 gap-1 text-[9px] font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">SRC:</span>{' '}
              <span className="text-white">{level.packet.srcIp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DST:</span>{' '}
              <span className="text-white">{level.packet.dstIp}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
