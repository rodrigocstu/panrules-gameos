// ShadowBanner — aviso accesible de reglas sombreadas (EGC-18, módulo Políticas de Red).
//
// Superficie moderna que sustituye al legacy ShadowWarning.jsx. Espeja el patrón aria-live de
// AvatarIntervention: la región `aria-live="polite"` / `aria-atomic` está SIEMPRE montada para que
// el lector de pantalla anuncie cuando aparece o desaparece un conflicto; el contenido visible solo
// se pinta cuando hay reportes. Driven en vivo por `detectShadowing(rules)` desde usePolicyModule.
//
// La indicación NO depende solo del color (contraste AA): cada conflicto se describe en texto
// (qué regla sombrea a cuál y por qué), i18n-ready ES/EN.

import type { ShadowReport, ShadowReason } from '../../../types/domain';

export interface ShadowBannerProps {
  shadowReports: ShadowReport[];
  /** Resuelve un id de regla a una etiqueta legible (p. ej. "Regla 1"). Por defecto usa el id. */
  ruleLabel?: (ruleId: string) => string;
}

const REASON_TEXT: Record<ShadowReason, string> = {
  'deny-before-allow':
    'una regla DENY anterior descarta el tráfico antes de que esta regla ALLOW pueda evaluarlo',
  'superset-source': "una regla anterior con zona de origen 'any' ya cubre este tráfico",
  'superset-dest': "una regla anterior con zona de destino 'any' ya cubre este tráfico",
  'superset-app': "una regla anterior con aplicación 'any' ya cubre este tráfico",
};

export function ShadowBanner({ shadowReports, ruleLabel = (id) => id }: ShadowBannerProps) {
  const hasReports = shadowReports.length > 0;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      data-testid="shadow-banner-live-region"
      className="motion-reduce:transition-none"
    >
      {hasReports && (
        <div
          role="alert"
          data-testid="shadow-banner"
          className="flex flex-col gap-1 rounded-xl border border-accent/50 bg-accent/10 p-3"
        >
          <p className="text-mobile-sm font-semibold text-accent-dark">
            {shadowReports.length === 1
              ? 'Hay 1 regla sombreada (nunca se alcanza)'
              : `Hay ${shadowReports.length} reglas sombreadas (nunca se alcanzan)`}
          </p>
          <ul className="flex flex-col gap-1">
            {shadowReports.map((report) => (
              <li
                key={`${report.shadowingRuleId}->${report.shadowedRuleId}`}
                className="text-mobile-xs leading-snug text-neutral-700"
              >
                <span className="font-medium">{ruleLabel(report.shadowedRuleId)}</span> queda
                sombreada por <span className="font-medium">{ruleLabel(report.shadowingRuleId)}</span>
                : {REASON_TEXT[report.reason]}.
              </li>
            ))}
          </ul>
          <p className="text-mobile-xs text-neutral-600">
            Reordena o deshabilita reglas para que cada regla pueda alcanzarse.
          </p>
        </div>
      )}
    </div>
  );
}

export default ShadowBanner;
