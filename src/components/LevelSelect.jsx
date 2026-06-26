import { useState } from 'react';
import { CheckCircle, PlayCircle, X } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y.js';
import { useI18n, pickText } from '../i18n/I18nContext.jsx';

const TITLE_ID = 'level-select-title';

// Colores de badge por tier
const TIER_BADGE = {
  F: { bg: 'bg-emerald-700', text: 'text-white', label: 'F' },
  N: { bg: 'bg-blue-700', text: 'text-white', label: 'N' },
  A: { bg: 'bg-red-700', text: 'text-white', label: 'A' },
};

/**
 * LevelSelect — panel modal para elegir o repetir cualquier escenario.
 *
 * Props:
 *   levels      : array de objetos nivel ({ id, title, desc, tier?, tracks? })
 *   currentIdx  : índice del nivel activo
 *   completed   : Set<number> con los ids de niveles completados
 *   attempts    : Record<number, number> intentos por id
 *   onSelect    : (idx: number) => void
 *   onClose     : () => void
 */
export default function LevelSelect({
  levels,
  currentIdx,
  completed,
  attempts,
  onSelect,
  onClose,
}) {
  const { lang, t } = useI18n();
  const { containerRef } = useModalA11y(true, onClose);

  // Filtro de track activo: 'all' | 'ngfw-engineer' | 'netsec-architect'
  const [activeTrack, setActiveTrack] = useState('all');

  // Filtrar los niveles según el track activo
  const filteredLevels = levels.filter((level) => {
    if (activeTrack === 'all') return true;
    if (activeTrack === 'ngfw-engineer') {
      return level.tier === 'F' || (level.tracks && level.tracks.includes('ngfw-engineer'));
    }
    if (activeTrack === 'netsec-architect') {
      return level.tier === 'A' || (level.tracks && level.tracks.includes('netsec-architect'));
    }
    return true;
  });

  // Cuando hay un track activo, agrupar por tier
  const shouldGroup = activeTrack !== 'all';

  // Construir grupos ordenados
  const tierOrder = ['F', 'N', 'A'];
  const tierLabelKey = { F: 'tier.F.label', N: 'tier.N.label', A: 'tier.A.label' };
  const tierEmoji = { F: '🟢', N: '🔵', A: '🔴' };

  const groupedByTier = shouldGroup
    ? tierOrder.reduce((acc, tier) => {
        const tieredLevels = filteredLevels.filter((l) => l.tier === tier);
        if (tieredLevels.length > 0) acc[tier] = tieredLevels;
        return acc;
      }, {})
    : null;

  const trackBtnClass = (track) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
      activeTrack === track
        ? 'bg-orange-600 text-white'
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`;

  const renderLevel = (level, idx) => {
    // idx is the index in the original `levels` array
    const originalIdx = levels.indexOf(level);
    const isCompleted = completed.has(level.id);
    const isCurrent = originalIdx === currentIdx;
    const levelAttempts = attempts[level.id] ?? 0;
    const tierBadge = level.tier ? TIER_BADGE[level.tier] : null;

    return (
      <li key={level.id}>
        <button
          onClick={() => {
            onSelect(originalIdx);
            onClose();
          }}
          className={`w-full text-left p-4 rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
            isCurrent
              ? 'border-orange-500 bg-orange-950/40'
              : isCompleted
                ? 'border-emerald-600 bg-emerald-950/30 hover:bg-emerald-950/50'
                : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Ícono de estado */}
            <div className="mt-0.5 shrink-0">
              {isCompleted ? (
                <CheckCircle size={20} className="text-emerald-400" />
              ) : (
                <PlayCircle
                  size={20}
                  className={isCurrent ? 'text-orange-400' : 'text-slate-400'}
                />
              )}
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-slate-400">
                  {t('select.level')} {level.id}
                </span>
                {/* Badge de tier */}
                {tierBadge && (
                  <span
                    className={`text-xs ${tierBadge.bg} ${tierBadge.text} px-1.5 py-0.5 rounded font-bold`}
                  >
                    {tierBadge.label}
                  </span>
                )}
                {isCurrent && (
                  <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded font-semibold">
                    {t('select.current')}
                  </span>
                )}
                {isCompleted && (
                  <span className="text-xs bg-emerald-700 text-white px-1.5 py-0.5 rounded font-semibold">
                    {t('select.completed')}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                {pickText(level.title, lang)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {pickText(level.desc, lang)}
              </p>
              {levelAttempts > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {levelAttempts}{' '}
                  {levelAttempts === 1 ? t('select.attempt') : t('select.attempts')}
                </p>
              )}
            </div>
          </div>
        </button>
      </li>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
    >
      <div
        ref={containerRef}
        className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]"
        tabIndex={-1}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 id={TITLE_ID} className="text-xl font-bold text-white">
            {t('select.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
            aria-label={t('select.aria.close')}
          >
            <X size={24} />
          </button>
        </div>

        {/* Filtros de track */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-700 flex gap-2 flex-wrap">
          <button
            className={trackBtnClass('all')}
            onClick={() => setActiveTrack('all')}
            aria-pressed={activeTrack === 'all'}
          >
            {t('track.all')}
          </button>
          <button
            className={trackBtnClass('ngfw-engineer')}
            onClick={() => setActiveTrack('ngfw-engineer')}
            aria-pressed={activeTrack === 'ngfw-engineer'}
          >
            {t('track.ngfw-engineer')}
          </button>
          <button
            className={trackBtnClass('netsec-architect')}
            onClick={() => setActiveTrack('netsec-architect')}
            aria-pressed={activeTrack === 'netsec-architect'}
          >
            {t('track.netsec-architect')}
          </button>
        </div>

        {/* Lista de niveles */}
        <div className="overflow-y-auto flex-1 p-4">
          {shouldGroup ? (
            // Vista agrupada por tier
            <div className="space-y-4">
              {tierOrder.map((tier) => {
                const tieredLevels = groupedByTier[tier];
                if (!tieredLevels) return null;
                return (
                  <div key={tier}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-sm">{tierEmoji[tier]}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {t(tierLabelKey[tier])}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {tieredLevels.map((level) => renderLevel(level))}
                    </ul>
                  </div>
                );
              })}
              {filteredLevels.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">
                  {t('track.all')}
                </p>
              )}
            </div>
          ) : (
            // Vista plana (todos los niveles)
            <ul className="space-y-3">
              {filteredLevels.map((level) => renderLevel(level))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
