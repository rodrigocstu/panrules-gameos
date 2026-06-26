import { Layers, CheckCircle, Repeat, Star, Flame } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useConsoleData } from '../../hooks/useConsoleData.js';
import HeatMap from './HeatMap.jsx';

// Tarjeta de métrica reutilizable.
function MetricCard({ icon: Icon, value, label, accent }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-3">
      <div className={`p-2 rounded-md ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-white leading-none">{value}</div>
        <div className="text-xs text-slate-400 mt-1 truncate">{label}</div>
      </div>
    </div>
  );
}

/**
 * ConsoleDashboard — vista principal de la consola: tarjetas de métricas
 * agregadas (derivadas del progreso real en localStorage) + heatmap de los
 * 43 niveles por dificultad observada.
 */
export default function ConsoleDashboard() {
  const { t } = useI18n();
  const { perLevel, totals } = useConsoleData();

  return (
    <div className="space-y-6">
      {/* Métricas agregadas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={CheckCircle}
          value={`${totals.completed}/${totals.levels}`}
          label={t('console.metric.completed')}
          accent="bg-emerald-600"
        />
        <MetricCard
          icon={Repeat}
          value={totals.totalAttempts}
          label={t('console.metric.attempts')}
          accent="bg-blue-600"
        />
        <MetricCard
          icon={Star}
          value={totals.score}
          label={t('console.metric.score')}
          accent="bg-amber-500"
        />
        <MetricCard
          icon={Flame}
          value={totals.bestStreak}
          label={t('console.metric.beststreak')}
          accent="bg-orange-600"
        />
      </div>

      {/* Desglose por tier */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">{totals.tierF}</div>
          <div className="text-xs text-slate-400">{t('tier.F.label')}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">{totals.tierN}</div>
          <div className="text-xs text-slate-400">{t('tier.N.label')}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-400">{totals.tierA}</div>
          <div className="text-xs text-slate-400">{t('tier.A.label')}</div>
        </div>
      </div>

      {/* Heatmap de dificultad */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={16} className="text-orange-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            {t('console.heatmap.title')}
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">{t('console.heatmap.subtitle')}</p>

        {totals.hasData ? (
          <HeatMap perLevel={perLevel} />
        ) : (
          <div>
            <p className="text-sm text-slate-500 mb-4 italic">{t('console.empty')}</p>
            <HeatMap perLevel={perLevel} />
          </div>
        )}
      </div>
    </div>
  );
}
