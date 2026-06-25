import { CheckCircle, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

// Overlay de resultado (éxito / fallo). Devuelve null fuera de esos estados.
//
// NOTA: el copy "TRAFFIC ALLOWED" está hoy hardcodeado y no deriva de la solución
// (bug #1 / T2.1). Se corrige en WP-3; aquí solo se reubica sin cambiar comportamiento.
export default function ResultOverlay({ gameState, reason, onNext, onReconfigure }) {
  if (gameState !== 'success' && gameState !== 'failure') return null;

  const isSuccess = gameState === 'success';

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center animate-in fade-in zoom-in duration-300">
      <div
        className={`p-8 rounded-xl border shadow-2xl max-w-md text-center backdrop-blur-md ${isSuccess ? 'border-emerald-500 bg-emerald-950/50' : 'border-red-500 bg-red-950/50'}`}
      >
        {isSuccess ? (
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        ) : (
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        )}
        <h3 className="text-2xl font-bold text-white mb-2">
          {isSuccess ? 'TRAFFIC ALLOWED' : 'POLICY BLOCKED'}
        </h3>
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
