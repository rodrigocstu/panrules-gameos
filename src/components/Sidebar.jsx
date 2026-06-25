import { Activity, Lock, Globe } from 'lucide-react';

// Barra lateral: navegación del dashboard + ticket del incidente actual.
export default function Sidebar({ levelIdx, level }) {
  return (
    // sm: ocupa ancho completo como banda horizontal (flex-row).
    // lg: vuelve al carril lateral (col-span-2, flex-col).
    <div className="col-span-12 lg:col-span-2 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-row lg:flex-col py-2 lg:py-4 z-40 gap-4 lg:gap-0 px-4 lg:px-0 overflow-x-auto lg:overflow-x-visible">
      {/* Sección de navegación */}
      <div className="lg:px-4 lg:mb-6 shrink-0 lg:shrink">
        <div className="text-xs font-bold text-slate-500 mb-1 lg:mb-2 uppercase tracking-wider hidden lg:block">
          Dashboard
        </div>
        <div className="flex flex-row lg:flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-300 bg-slate-800 px-3 py-2 rounded cursor-pointer border-l-2 border-orange-500 text-xs whitespace-nowrap">
            <Activity size={14} /> Monitor
          </div>
          <div className="flex items-center gap-2 text-slate-400 px-3 py-2 hover:text-slate-200 cursor-pointer text-xs whitespace-nowrap">
            <Lock size={14} /> Policies
          </div>
          <div className="flex items-center gap-2 text-slate-400 px-3 py-2 hover:text-slate-200 cursor-pointer text-xs whitespace-nowrap">
            <Globe size={14} /> Network
          </div>
        </div>
      </div>

      {/* Ticket del incidente */}
      <div className="lg:px-4 lg:mt-auto flex-1 lg:flex-none min-w-[200px] lg:min-w-0">
        <div className="bg-slate-800 rounded p-3 border border-slate-700">
          <h3 className="text-xs font-bold text-orange-500 mb-1">Incident #{2040 + levelIdx}</h3>
          <p className="text-xs text-slate-400 leading-tight mb-2">{level.desc}</p>
          <div className="pt-2 border-t border-slate-700 grid grid-cols-1 gap-1 text-xs font-mono">
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
