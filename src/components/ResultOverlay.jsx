import { CheckCircle, ShieldCheck, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import ExplanationPanel from './ExplanationPanel.jsx';
import SetCommandPanel from './SetCommandPanel.jsx';
import MitrePanel from './MitrePanel.jsx';
import PolicyTutor from './PolicyTutor.jsx';
import { resolveExplanation } from '../lib/explanations';
import { useI18n } from '../i18n/I18nContext.jsx';

// Overlay de resultado (éxito / fallo). Devuelve null fuera de esos estados.
//
// El encabezado deriva de `outcome` (T2.1), traducido (T3.6):
//  - 'allow-win'  -> acierto y el tráfico pasa
//  - 'block-win'  -> acierto y el tráfico se bloquea
//  - 'failure'    -> configuración incorrecta
//
// El veredicto (línea bajo el encabezado) se TRADUCE por `reasonCode` interpolando
// los valores esperados desde level.solution, en lugar de mostrar el texto del
// motor (que es ES fijo). Debajo, una microlección pedagógica (T2.7) bilingüe.

export default function ResultOverlay({
  gameState,
  reason,
  outcome,
  level,
  reasonCode,
  ruleName,
  config,
  onNext,
  onReconfigure,
}) {
  const { lang, t } = useI18n();
  if (gameState !== 'success' && gameState !== 'failure') return null;

  const isSuccess = gameState === 'success';
  const resolvedOutcome = outcome ?? (isSuccess ? 'allow-win' : 'failure');
  const isBlockWin = resolvedOutcome === 'block-win';

  const HEADINGS = {
    'allow-win': t('result.allow'),
    'block-win': t('result.block'),
    failure: t('result.fail'),
  };
  const heading = HEADINGS[resolvedOutcome] ?? (isSuccess ? t('result.allow') : t('result.fail'));

  // Veredicto traducido por reasonCode (T3.6); si falta el código, cae al texto
  // del motor (`reason`). Interpola los valores esperados desde la solución.
  const sol = level?.solution ?? {};
  const reasonText = reasonCode
    ? t(`reason.${reasonCode}`, {
        app: sol.app,
        service: sol.service,
        nat: sol.nat,
        profile: sol.profile,
      })
    : reason;

  const explanation = level ? resolveExplanation(level, reasonCode, lang) : '';

  // Color: éxito que bloquea usa azul, éxito que permite usa verde, fallo rojo.
  const tone = !isSuccess
    ? 'border-red-500 bg-red-950/50'
    : isBlockWin
      ? 'border-sky-500 bg-sky-950/50'
      : 'border-emerald-500 bg-emerald-950/50';

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center animate-in fade-in zoom-in duration-300 p-4 overflow-y-auto">
      <div
        className={`p-8 rounded-xl border shadow-2xl max-w-md my-auto text-center backdrop-blur-md ${tone}`}
      >
        {!isSuccess ? (
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        ) : isBlockWin ? (
          <ShieldCheck className="w-16 h-16 text-sky-400 mx-auto mb-4" />
        ) : (
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        )}
        <h3 className="text-2xl font-bold text-white mb-2">{heading}</h3>
        <p className="text-sm text-slate-300 mb-3 leading-relaxed">{reasonText}</p>
        <ExplanationPanel text={explanation} title={t('result.why')} />
        {/* MITRE ATT&CK Mapper (5.2): al ganar, qué técnica ofensiva se bloqueó. */}
        {isSuccess && level && <MitrePanel levelId={level.id} />}
        {/* Adaptive Policy Tutor (5.1): al fallar, qué corregir (offline + IA opcional). */}
        {!isSuccess && config && (
          <PolicyTutor level={level} config={config} reasonCode={reasonCode} />
        )}
        {/* Puente a PAN-OS real (T3.4): el comando set solo al acertar. */}
        {isSuccess && <SetCommandPanel level={level} ruleName={ruleName} />}
        {isSuccess ? (
          <button
            onClick={onNext}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto transition-all hover:scale-105"
          >
            {t('result.next')} <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={onReconfigure}
            className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={18} /> {t('result.reconfigure')}
          </button>
        )}
      </div>
    </div>
  );
}
