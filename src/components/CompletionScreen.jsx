import { Award, RotateCcw, List } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y.js';
import { useI18n } from '../i18n/I18nContext.jsx';

const TITLE_ID = 'completion-title';

/**
 * CompletionScreen — pantalla de cierre al completar todos los escenarios.
 * Reemplaza el alert() eliminado. Muestra felicitaciones y ofrece repetir o
 * volver al selector de nivel.
 *
 * Props:
 *   totalLevels    : number   — cantidad total de escenarios.
 *   attempts       : Record<number, number> — intentos por id de nivel.
 *   onRepeat       : () => void — reinicia desde el nivel 1.
 *   onSelectLevel  : () => void — abre el selector de niveles.
 */
export default function CompletionScreen({
  totalLevels,
  attempts,
  score = 0,
  bestStreak = 0,
  onRepeat,
  onSelectLevel,
}) {
  const { t } = useI18n();
  const totalAttempts = Object.values(attempts).reduce((sum, n) => sum + n, 0);

  // No hay cierre explícito en este modal; usamos onSelectLevel como escape.
  const { containerRef } = useModalA11y(true, onSelectLevel);

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
    >
      <div
        ref={containerRef}
        className="bg-slate-800 border border-yellow-500 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center"
        tabIndex={-1}
      >
        {/* Ícono principal */}
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-500/20 p-4 rounded-full">
            <Award size={56} className="text-yellow-400" />
          </div>
        </div>

        {/* Título */}
        <h2 id={TITLE_ID} className="text-3xl font-bold text-white mb-2">
          {t('done.title')}
        </h2>
        <p className="text-yellow-400 font-semibold text-lg mb-4">{t('done.subtitle')}</p>

        {/* Estadísticas */}
        <div className="bg-slate-900/60 rounded-xl p-4 mb-8 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{t('done.stat.score')}</span>
            <span className="text-amber-400 font-bold">{score}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{t('done.stat.completed')}</span>
            <span className="text-white font-bold">
              {totalLevels} / {totalLevels}
            </span>
          </div>
          {bestStreak > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{t('done.stat.streak')}</span>
              <span className="text-white font-bold">{bestStreak}</span>
            </div>
          )}
          {totalAttempts > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{t('done.stat.attempts')}</span>
              <span className="text-white font-bold">{totalAttempts}</span>
            </div>
          )}
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-8">{t('done.body')}</p>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onSelectLevel}
            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <List size={18} />
            {t('done.choose')}
          </button>
          <button
            onClick={onRepeat}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <RotateCcw size={18} />
            {t('done.repeat')}
          </button>
        </div>
      </div>
    </div>
  );
}
