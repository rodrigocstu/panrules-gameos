import { useI18n, pickText } from '../../i18n/I18nContext.jsx';

// Estilo por dificultad observada. Verde=fácil, ámbar=media, rojo=difícil,
// gris=intentado sin éxito, gris oscuro=sin intentar.
const DIFF_STYLE = {
  easy: 'bg-emerald-600 text-white',
  medium: 'bg-amber-500 text-black',
  hard: 'bg-red-700 text-white',
  attempted: 'bg-slate-500 text-white',
  untried: 'bg-slate-800 text-slate-500 border border-slate-700',
};

const LEGEND_ORDER = ['easy', 'medium', 'hard', 'attempted', 'untried'];

/**
 * HeatMap — cuadrícula de los 43 niveles coloreados por dificultad observada.
 *
 * Props:
 *   perLevel : Array<{ id, title, tier, completed, attempts, difficulty }>
 *
 * Cada celda expone título + aria-label con el nombre del nivel, su dificultad
 * y el número de intentos, para que la analítica sea legible con lector de pantalla.
 */
export default function HeatMap({ perLevel }) {
  const { lang, t } = useI18n();

  return (
    <div>
      <ul
        className="grid grid-cols-10 gap-1.5 list-none m-0 p-0"
        aria-label={t('console.heatmap.aria')}
      >
        {perLevel.map((lvl) => {
          const cls = DIFF_STYLE[lvl.difficulty] ?? DIFF_STYLE.untried;
          const label = `${t('console.level')} ${lvl.id} — ${pickText(lvl.title, lang)}: ${t(
            `console.diff.${lvl.difficulty}`
          )} (${lvl.attempts} ${t('console.attempts')})`;
          return (
            <li
              key={lvl.id}
              className={`aspect-square rounded flex items-center justify-center text-[11px] font-bold select-none ${cls}`}
              title={label}
              aria-label={label}
            >
              {lvl.id}
            </li>
          );
        })}
      </ul>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        {LEGEND_ORDER.map((diff) => (
          <span key={diff} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded ${DIFF_STYLE[diff]}`} aria-hidden="true" />
            {t(`console.diff.${diff}`)}
          </span>
        ))}
      </div>
    </div>
  );
}
