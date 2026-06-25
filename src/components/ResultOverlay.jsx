import { CheckCircle, ShieldCheck, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

// Overlay de resultado (éxito / fallo). Devuelve null fuera de esos estados.
//
// El encabezado deriva de `outcome` (T2.1), NO de un texto hardcodeado:
//  - 'allow-win'  -> acierto y el tráfico pasa   ("TRÁFICO PERMITIDO")
//  - 'block-win'  -> acierto y el tráfico se bloquea ("TRÁFICO BLOQUEADO (correcto)")
//  - 'failure'    -> configuración incorrecta    ("POLÍTICA BLOQUEADA")
// Si no llega `outcome`, se infiere del gameState (compatibilidad).
const HEADINGS = {
  'allow-win': 'TRÁFICO PERMITIDO',
  'block-win': 'TRÁFICO BLOQUEADO (correcto)',
  failure: 'POLÍTICA BLOQUEADA',
};

export default function ResultOverlay({ gameState, reason, outcome, onNext, onReconfigure }) {
  if (gameState !== 'success' && gameState !== 'failure') return null;

  const isSuccess = gameState === 'success';
  const resolvedOutcome = outcome ?? (isSuccess ? 'allow-win' : 'failure');
  const isBlockWin = resolvedOutcome === 'block-win';
  const heading =
    HEADINGS[resolvedOutcome] ?? (isSuccess ? 'TRÁFICO PERMITIDO' : 'POLÍTICA BLOQUEADA');

  // Color: éxito que bloquea usa azul (acción de bloqueo correcta), éxito que
  // permite usa verde, fallo usa rojo.
  const tone = !isSuccess
    ? 'border-red-500 bg-red-950/50'
    : isBlockWin
      ? 'border-sky-500 bg-sky-950/50'
      : 'border-emerald-500 bg-emerald-950/50';

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center animate-in fade-in zoom-in duration-300">
      <div
        className={`p-8 rounded-xl border shadow-2xl max-w-md text-center backdrop-blur-md ${tone}`}
      >
        {!isSuccess ? (
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        ) : isBlockWin ? (
          <ShieldCheck className="w-16 h-16 text-sky-400 mx-auto mb-4" />
        ) : (
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        )}
        <h3 className="text-2xl font-bold text-white mb-2">{heading}</h3>
        <p className="text-sm text-slate-300 mb-8 leading-relaxed">{reason}</p>
        {isSuccess ? (
          <button
            onClick={onNext}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto transition-all hover:scale-105"
          >
            Next Scenario <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={onReconfigure}
            className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={18} /> Reconfigure
          </button>
        )}
      </div>
    </div>
  );
}
