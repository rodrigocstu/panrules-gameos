import { useState, useEffect } from 'react';
import { Activity, Lock, Globe, Lightbulb, ChevronDown, LayoutGrid } from 'lucide-react';
import { useI18n, pickText } from '../i18n/I18nContext.jsx';
import { LEVELS } from '../data/levels';

// Barra lateral: navegación del dashboard + ticket del incidente actual.
// `onOpenLevelSelect` abre el selector de niveles (T3.3) durante el juego.
// `completed` (Set<number>) habilita la barra de progreso por cert track.
export default function Sidebar({ levelIdx, level, onOpenLevelSelect, completed, style }) {
  const { lang, t } = useI18n();
  // Disclosure de la pista (T2.7): ayuda opcional durante la configuración. Se
  // cierra al cambiar de nivel para no arrastrar la pista del escenario anterior.
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    setShowHint(false);
  }, [levelIdx]);

  const hintPanelId = 'sidebar-hint-panel';
  const hint = pickText(level.hint, lang);

  // Calcular progreso del track del nivel actual
  const currentTracks = level.tracks ?? [];
  const showNgfw = currentTracks.includes('ngfw-engineer') || level.tier === 'F';
  const showArchitect = currentTracks.includes('netsec-architect') || level.tier === 'A';

  const ngfwLevels = LEVELS.filter((l) => l.tracks && l.tracks.includes('ngfw-engineer'));
  const architectLevels = LEVELS.filter((l) => l.tracks && l.tracks.includes('netsec-architect'));

  const safeCompleted = completed ?? new Set();
  const ngfwDone = ngfwLevels.filter((l) => safeCompleted.has(l.id)).length;
  const architectDone = architectLevels.filter((l) => safeCompleted.has(l.id)).length;

  return (
    <div
      className="bg-slate-900 border-r border-slate-800 flex flex-col py-4 z-40 overflow-y-auto shrink-0"
      style={style}
    >
      {/* Sección de navegación */}
      <div className="px-4 mb-6 shrink-0">
        <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
          {t('side.dashboard')}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-300 bg-slate-800 px-3 py-2 rounded cursor-pointer border-l-2 border-orange-500 text-xs whitespace-nowrap">
            <Activity size={14} /> {t('side.monitor')}
          </div>
          <div className="flex items-center gap-2 text-slate-400 px-3 py-2 hover:text-slate-200 cursor-pointer text-xs whitespace-nowrap">
            <Lock size={14} /> {t('side.policies')}
          </div>
          <div className="flex items-center gap-2 text-slate-400 px-3 py-2 hover:text-slate-200 cursor-pointer text-xs whitespace-nowrap">
            <Globe size={14} /> {t('side.network')}
          </div>
          <button
            type="button"
            onClick={onOpenLevelSelect}
            className="flex items-center gap-2 text-slate-400 px-3 py-2 hover:text-slate-200 cursor-pointer text-xs whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded text-left"
          >
            <LayoutGrid size={14} /> {t('side.levels')}
          </button>
        </div>
      </div>

      {/* Ticket del incidente */}
      <div className="px-4 mt-auto">
        <div className="bg-slate-800 rounded p-3 border border-slate-700">
          <h3 className="text-xs font-bold text-orange-500 mb-1">
            {t('side.incident')} #{2040 + levelIdx}
          </h3>
          <p className="text-xs text-slate-400 leading-tight mb-2">{pickText(level.desc, lang)}</p>
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
          {hint && (
            <div className="mt-3 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                aria-expanded={showHint}
                aria-controls={hintPanelId}
                className="flex items-center justify-between w-full text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb size={13} aria-hidden="true" /> {t('side.hint')}
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
                  {hint}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progreso por cert track (compacto, solo en lg) */}
        {(showNgfw || showArchitect) && (
          <div className="mt-2 bg-slate-800/60 rounded p-2 border border-slate-700/50 space-y-2">
            {showNgfw && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                  <span>{t('progress.ngfw', { done: ngfwDone, total: ngfwLevels.length })}</span>
                </div>
                <div className="bg-slate-700 rounded-full h-1">
                  <div
                    className="bg-emerald-500 h-1 rounded-full transition-all"
                    style={{
                      width: `${ngfwLevels.length > 0 ? (ngfwDone / ngfwLevels.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {showArchitect && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                  <span>
                    {t('progress.architect', {
                      done: architectDone,
                      total: architectLevels.length,
                    })}
                  </span>
                </div>
                <div className="bg-slate-700 rounded-full h-1">
                  <div
                    className="bg-yellow-500 h-1 rounded-full transition-all"
                    style={{
                      width: `${architectLevels.length > 0 ? (architectDone / architectLevels.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
