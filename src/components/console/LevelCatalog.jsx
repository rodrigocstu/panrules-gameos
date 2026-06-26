import { useState } from 'react';
import { CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { useI18n, pickText } from '../../i18n/I18nContext.jsx';
import { LEVELS } from '../../data/levels';
import { smeStatusOf } from '../../data/sme-status';

const TIER_BADGE = {
  F: 'bg-emerald-700',
  N: 'bg-blue-700',
  A: 'bg-red-700',
};

const SME_BADGE = {
  verified: { icon: CheckCircle, cls: 'text-emerald-400', key: 'console.sme.verified' },
  corrected: { icon: Wrench, cls: 'text-sky-400', key: 'console.sme.corrected' },
  pending: { icon: AlertTriangle, cls: 'text-amber-400', key: 'console.sme.pending' },
};

const FILTERS = ['all', 'ngfw-engineer', 'netsec-architect'];

function matchesTrack(level, filter) {
  if (filter === 'all') return true;
  if (filter === 'ngfw-engineer')
    return level.tier === 'F' || (level.tracks || []).includes('ngfw-engineer');
  if (filter === 'netsec-architect')
    return level.tier === 'A' || (level.tracks || []).includes('netsec-architect');
  return true;
}

/**
 * LevelCatalog — catálogo de los 43 niveles con filtro por track y estado de
 * revisión SME (derivado de docs/accuracy-review.md vía smeStatusOf).
 */
export default function LevelCatalog() {
  const { lang, t } = useI18n();
  const [filter, setFilter] = useState('all');

  const levels = LEVELS.filter((l) => matchesTrack(l, filter));
  const pendingCount = levels.filter((l) => smeStatusOf(l.id) === 'pending').length;

  const btnClass = (f) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
      filter === f ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`;

  return (
    <div className="space-y-4">
      {/* Filtros + resumen */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f} className={btnClass(f)} onClick={() => setFilter(f)} aria-pressed={filter === f}>
            {t(`track.${f === 'all' ? 'all' : f}`)}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">
          {levels.length} {t('console.catalog.levels')}
          {pendingCount > 0 && (
            <span className="ml-2 text-amber-400">
              · {pendingCount} {t('console.sme.pending')}
            </span>
          )}
        </span>
      </div>

      {/* Tabla de niveles */}
      <ul className="space-y-1.5" aria-label={t('console.catalog.aria')}>
        {levels.map((level) => {
          const status = smeStatusOf(level.id);
          const sme = SME_BADGE[status];
          const SmeIcon = sme.icon;
          return (
            <li
              key={level.id}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 flex items-center gap-3"
            >
              <span className="text-xs font-mono text-slate-500 w-8 shrink-0">L{level.id}</span>
              <span
                className={`text-xs ${TIER_BADGE[level.tier] ?? 'bg-slate-600'} text-white px-1.5 py-0.5 rounded font-bold shrink-0`}
              >
                {level.tier}
              </span>
              <span className="flex-1 min-w-0 text-sm text-white truncate">
                {pickText(level.title, lang)}
              </span>
              <span className={`flex items-center gap-1 text-xs shrink-0 ${sme.cls}`} title={t(sme.key)}>
                <SmeIcon size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{t(sme.key)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
