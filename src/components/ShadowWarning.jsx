import { useI18n } from '../i18n/I18nContext.jsx';

/**
 * ShadowWarning — banner de advertencia cuando detectShadowing detecta reglas sombreadas.
 *
 * Props:
 *   shadowReports : ShadowReport[]   — resultado de detectShadowing(rules).
 *                                     Si está vacío, no renderiza nada.
 *
 * Se muestra en tiempo real dentro del MultiRuleEditor cuando el usuario
 * ha configurado al menos 2 reglas con posible shadowing.
 */
export default function ShadowWarning({ shadowReports }) {
  const { t } = useI18n();

  if (!shadowReports || shadowReports.length === 0) return null;

  return (
    <div
      role="alert"
      className="mx-4 mb-2 bg-amber-950/60 border border-amber-500 rounded-lg px-4 py-2 space-y-1"
    >
      {shadowReports.map((report) => (
        <p key={`${report.shadowingRuleId}->${report.shadowedRuleId}`} className="text-xs text-amber-300">
          {t('multirule.shadow.warning', {
            shadowed: report.shadowedRuleId,
            shadowing: report.shadowingRuleId,
          })}
        </p>
      ))}
    </div>
  );
}
