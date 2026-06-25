import { useState, useEffect } from 'react';
import { Activity, Lock, Globe, Lightbulb, ChevronDown, LayoutGrid } from 'lucide-react';

// Barra lateral: navegación del dashboard + ticket del incidente actual.
// `onOpenLevelSelect` abre el selector de niveles (T3.3) durante el juego.
export default function Sidebar({ levelIdx, level, onOpenLevelSelect }) {
  // Disclosure de la pista (T2.7): ayuda opcional durante la configuración. Se
  // cierra al cambiar de nivel para no arrastrar la pista del escenario anterior.
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    setShowHint(false);
  }, [levelIdx]);

  const hintPanelId = 'sidebar-hint-panel';

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
          <button
            type="button"
            onClick={onOpenLevelSelect}
            className="flex items-center gap-2 text-slate-400 px-3 py-2 hover:text-slate-200 cursor-pointer text-xs whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded text-left"
          >
            <LayoutGrid size={14} /> Niveles
          </button>
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

          {/* Pista opcional (T2.7): ayuda durante la configuración. */}
          {level.hint && (
            <div className="mt-3 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                aria-expanded={showHint}
                aria-controls={hintPanelId}
                className="flex items-center justify-between w-full text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb size={13} aria-hidden="true" /> Pista
                </span>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={`transition-transform ${showHint ? 'rotate-180' : ''}`}
                />
              </button>
              {showHint && (
                <p
                  id={hintPanelId}
                  className="mt-2 text-xs text-slate-300 leading-relaxed font-sans"
                >
                  {level.hint}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
