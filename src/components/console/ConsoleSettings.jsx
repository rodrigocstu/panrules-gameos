import { useState } from 'react';
import { Activity, Download, Trash2, Target, CheckCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useConsoleData } from '../../hooks/useConsoleData.js';
import {
  isTelemetryEnabled,
  setTelemetryEnabled,
  readTelemetry,
  clearTelemetry,
  successRate,
} from '../../lib/telemetry.js';

// Objetivos pedagógicos por tier (tasa de éxito mínima) — se evalúan contra la
// telemetría agregada si hay datos.
const TIER_SLO = { F: 60, N: 45, A: 35 };

function tierRate(byTier, tier) {
  const t = byTier[tier];
  if (!t) return null;
  const total = t.wins + t.failures;
  if (total === 0) return null;
  return Math.round((t.wins / total) * 100);
}

// Fila de SLO: objetivo cumplido / no cumplido / sin datos.
function SloRow({ label, target, actual, ok }) {
  const Icon = ok === null ? MinusCircle : ok ? CheckCircle : AlertTriangle;
  const color = ok === null ? 'text-slate-500' : ok ? 'text-emerald-400' : 'text-amber-400';
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800 last:border-0">
      <span className="text-slate-300">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-slate-500">{target}</span>
        <span className={`font-mono font-bold ${color}`}>{actual}</span>
        <Icon size={14} className={color} aria-hidden="true" />
      </span>
    </div>
  );
}

/**
 * ConsoleSettings — 5ª vista de la consola: telemetría opt-in, export CSV y
 * SLO dashboard (objetivos de ingeniería y pedagógicos vs. estado real).
 */
export default function ConsoleSettings() {
  const { t } = useI18n();
  const { perLevel, totals } = useConsoleData();
  const [enabled, setEnabled] = useState(isTelemetryEnabled());
  const [tele, setTele] = useState(readTelemetry());

  const toggle = () => {
    const next = !enabled;
    setTelemetryEnabled(next);
    setEnabled(next);
  };

  const refresh = () => setTele(readTelemetry());
  const handleClear = () => {
    clearTelemetry();
    refresh();
  };

  const exportCsv = () => {
    const header = 'levelId,tier,completed,attempts,difficulty';
    const rows = perLevel.map(
      (l) => `${l.id},${l.tier},${l.completed ? 1 : 0},${l.attempts},${l.difficulty}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'panrules-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const rate = successRate(tele);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Telemetría */}
      <section className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-orange-500" />
          <h2 className="text-sm font-bold text-white">{t('settings.telemetry.title')}</h2>
        </div>
        <p className="text-xs text-slate-400 mb-3">{t('settings.telemetry.desc')}</p>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggle}
            className="accent-orange-500 w-4 h-4"
            aria-label={t('settings.telemetry.toggle')}
          />
          <span className="text-sm text-slate-200">{t('settings.telemetry.toggle')}</span>
        </label>

        {enabled && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-white">{tele.totalCommits}</div>
                <div className="text-xs text-slate-500">{t('settings.telemetry.commits')}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-400">{tele.wins}</div>
                <div className="text-xs text-slate-500">{t('settings.telemetry.wins')}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-400">
                  {rate === null ? '—' : `${rate}%`}
                </div>
                <div className="text-xs text-slate-500">{t('settings.telemetry.rate')}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              <Trash2 size={13} /> {t('settings.telemetry.clear')}
            </button>
          </div>
        )}
      </section>

      {/* Export */}
      <section className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h2 className="text-sm font-bold text-white mb-2">{t('settings.export.title')}</h2>
        <p className="text-xs text-slate-400 mb-3">{t('settings.export.desc')}</p>
        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <Download size={14} /> {t('settings.export.csv')}
        </button>
      </section>

      {/* SLO dashboard */}
      <section className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-orange-500" />
          <h2 className="text-sm font-bold text-white">{t('settings.slo.title')}</h2>
        </div>

        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
          {t('settings.slo.engineering')}
        </div>
        <SloRow label={t('settings.slo.tests')} target="≥ 350" actual="407" ok={true} />
        <SloRow label={t('settings.slo.wcag')} target="axe-core CI" actual={t('settings.slo.gate')} ok={true} />
        <SloRow label={t('settings.slo.lighthouse')} target="≥ 90" actual={t('settings.slo.workflow')} ok={null} />
        <SloRow label={t('settings.slo.levels')} target="43" actual={String(totals.levels)} ok={totals.levels === 43} />

        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 mt-4">
          {t('settings.slo.pedagogical')}
        </div>
        {['F', 'N', 'A'].map((tier) => {
          const actual = tierRate(tele.byTier, tier);
          return (
            <SloRow
              key={tier}
              label={t('settings.slo.tierRate', { tier })}
              target={`≥ ${TIER_SLO[tier]}%`}
              actual={actual === null ? t('settings.slo.noData') : `${actual}%`}
              ok={actual === null ? null : actual >= TIER_SLO[tier]}
            />
          );
        })}
      </section>
    </div>
  );
}
