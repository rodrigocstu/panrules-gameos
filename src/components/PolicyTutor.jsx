import { useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { buildTutorAdvice } from '../lib/tutor.js';

// URL del Cloudflare Worker de IA (opcional). Si no está configurada en build,
// el tutor funciona 100% offline con el análisis de diferencias.
const TUTOR_URL = import.meta.env.VITE_TUTOR_URL;

/**
 * PolicyTutor — Adaptive Policy Tutor (concepto disruptivo 5.1).
 *
 * Embebido en ResultOverlay tras un fallo. Por defecto da retroalimentación
 * OFFLINE comparando la config del jugador con la solución. Si VITE_TUTOR_URL
 * está configurada, ofrece además una explicación en lenguaje natural vía IA
 * (Claude haiku en un Worker), con fallback al modo offline ante error.
 *
 * Props:
 *   level       : el nivel actual
 *   config      : la configuración que el jugador envió (single-rule)
 *   reasonCode  : código del veredicto
 */
export default function PolicyTutor({ level, config, reasonCode }) {
  const { t } = useI18n();
  const [aiText, setAiText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  if (!config || !level) return null;

  const advice = buildTutorAdvice(level, config);

  const askAi = async () => {
    if (!TUTOR_URL) return;
    setLoading(true);
    setAiError(false);
    try {
      const res = await fetch(TUTOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelId: level.id, config, solution: level.solution, reasonCode }),
      });
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      setAiText(data.explanation || '');
    } catch {
      // Fallback: el modo offline ya está visible; solo marcamos el error.
      setAiError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 text-left bg-slate-900/70 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Bot size={15} className="text-orange-400" aria-hidden="true" />
        <span className="text-xs font-bold text-orange-400">{t('tutor.title')}</span>
      </div>

      {/* Análisis offline: qué cambiar campo por campo */}
      {advice.diffs.length > 0 ? (
        <ul className="space-y-1">
          {advice.diffs.map((d) => (
            <li key={d.field} className="text-xs text-slate-300 leading-relaxed">
              {t(`tutor.fix.${d.field}`, { your: String(d.your), correct: String(d.correct) })}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">{t('tutor.noDiff')}</p>
      )}

      {/* Explicación IA opcional */}
      {aiText && (
        <p className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-200 leading-relaxed">
          {aiText}
        </p>
      )}
      {aiError && <p className="mt-2 text-xs text-amber-400">{t('tutor.aiError')}</p>}

      {TUTOR_URL && !aiText && (
        <button
          type="button"
          onClick={askAi}
          disabled={loading}
          className="mt-2 flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 disabled:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" /> {t('tutor.thinking')}
            </>
          ) : (
            <>
              <Bot size={13} /> {t('tutor.askAi')}
            </>
          )}
        </button>
      )}
    </div>
  );
}
