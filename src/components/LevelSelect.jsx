import { CheckCircle, PlayCircle, X } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y.js';

const TITLE_ID = 'level-select-title';

/**
 * LevelSelect — panel modal para elegir o repetir cualquier escenario.
 *
 * Props:
 *   levels      : array de objetos nivel ({ id, title, desc })
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
  const { containerRef } = useModalA11y(true, onClose);

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
            Elegir escenario
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
            aria-label="Cerrar selector de escenarios"
          >
            <X size={24} />
          </button>
        </div>

        {/* Lista de niveles */}
        <ul className="overflow-y-auto flex-1 p-4 space-y-3">
          {levels.map((level, idx) => {
            const isCompleted = completed.has(level.id);
            const isCurrent = idx === currentIdx;
            const levelAttempts = attempts[level.id] ?? 0;

            return (
              <li key={level.id}>
                <button
                  onClick={() => {
                    onSelect(idx);
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
                        <span className="text-xs font-mono text-slate-400">Nivel {level.id}</span>
                        {isCurrent && (
                          <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded font-semibold">
                            actual
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs bg-emerald-700 text-white px-1.5 py-0.5 rounded font-semibold">
                            completado
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white mt-0.5">{level.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{level.desc}</p>
                      {levelAttempts > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          {levelAttempts} {levelAttempts === 1 ? 'intento' : 'intentos'}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
