/**
 * explanations — resuelve la microlección pedagógica a mostrar en el resultado.
 *
 * Función pura `resolveExplanation(level, reasonCode, lang)` SIN React: dado un
 * nivel, el `reasonCode` estable del veredicto y el idioma, devuelve el texto del
 * "por qué" (T2.7). Si el reasonCode tiene guía específica de fallo, la usa; en
 * otro caso cae a la `explanation` del nivel. Contenido bilingüe ES/EN (T3.6).
 */

import { pickText, DEFAULT_LANG } from '../i18n/pickText';
import type { Level, ReasonCode, Lang } from '../types/domain';

// Guía pedagógica por código de fallo, bilingüe. Solo cubre fallos genéricos
// (no terminales); el resto cae a `level.explanation`.
const REASON_GUIDANCE: Partial<Record<ReasonCode, Record<Lang, string>>> = {
  ZONE_MISMATCH: {
    es: 'En PAN-OS la Security Policy hace match por zona origen y zona destino (no por interfaz). Las zonas de la regla deben coincidir con las del paquete; recuerda que en escenarios con NAT la zona destino es la post-NAT (la que resuelve el route-lookup), aunque la IP destino siga siendo la pública pre-NAT.',
    en: 'In PAN-OS the Security Policy matches on source and destination zone (not on interface). The rule zones must match the packet zones; remember that in NAT scenarios the destination zone is the post-NAT one (resolved by the route lookup), even though the destination IP is still the pre-NAT public address.',
  },
  APP_MISMATCH: {
    es: 'App-ID identifica la aplicación real inspeccionando el contenido, no el puerto. La regla debe declarar exactamente la aplicación del escenario; usar App-ID "any" abre la regla a más tráfico del previsto y es una mala práctica de mínimo privilegio.',
    en: 'App-ID identifies the actual application by inspecting content, not the port. The rule must declare exactly the scenario application; using App-ID "any" opens the rule to more traffic than intended and is poor least-privilege practice.',
  },
  SERVICE_MISMATCH: {
    es: 'El campo Service controla en qué puertos se permite la aplicación. "application-default" restringe cada App-ID a sus puertos estándar; elegir otro servicio cambia qué puertos hacen match y por tanto el resultado de la regla.',
    en: 'The Service field controls which ports the application is allowed on. "application-default" restricts each App-ID to its standard ports; choosing another service changes which ports match and therefore the rule result.',
  },
  ACTION_MISMATCH: {
    es: 'La acción (allow / deny) determina el destino del paquete cuando la regla hace match. Debe derivarse de la intención del escenario: si el tráfico es legítimo, allow con su perfil; si es malicioso o no deseado, deny para descartarlo en la propia Security Policy.',
    en: 'The action (allow / deny) determines the packet fate when the rule matches. It must follow the scenario intent: if traffic is legitimate, allow with its profile; if malicious or unwanted, deny to drop it in the Security Policy itself.',
  },
  PROFILE_MISSING: {
    es: 'En PAN-OS los Security Profiles (Antivirus, Anti-Spyware, etc.) solo inspeccionan el tráfico que la regla PERMITE. Una regla allow sin perfil deja pasar el tráfico sin inspección de amenazas; por eso este escenario exige al menos el perfil indicado.',
    en: 'In PAN-OS, Security Profiles (Antivirus, Anti-Spyware, etc.) only inspect the traffic the rule ALLOWS. An allow rule without a profile lets traffic through with no threat inspection; that is why this scenario requires at least the indicated profile.',
  },
  PROFILE_INSUFFICIENT: {
    es: 'Un Security Profile más estricto cubre todo lo que cubre uno inferior. El perfil elegido no alcanza el nivel de inspección que pide el escenario: debes aplicar al menos el perfil requerido para proteger el tráfico permitido.',
    en: 'A stricter Security Profile covers everything a lower one does. The chosen profile does not reach the inspection level the scenario requires: you must apply at least the required profile to protect the allowed traffic.',
  },
  NAT_MISMATCH: {
    es: 'El NAT Rulebase es una tabla independiente de la Security Policy en PAN-OS. Puedes acertar toda la regla de seguridad y aun así fallar la traducción: el tipo de NAT (SNAT / DNAT / U-Turn) debe coincidir con lo que el escenario necesita, configurado en su propio rulebase.',
    en: 'The NAT Rulebase is a table separate from the Security Policy in PAN-OS. You can get the whole security rule right and still fail the translation: the NAT type (SNAT / DNAT / U-Turn) must match what the scenario needs, configured in its own rulebase.',
  },
};

export function resolveExplanation(
  level: Level | null | undefined,
  reasonCode: ReasonCode | undefined,
  lang: Lang = DEFAULT_LANG
): string {
  const guidance = reasonCode ? REASON_GUIDANCE[reasonCode] : undefined;
  if (guidance) {
    return guidance[lang] ?? guidance[DEFAULT_LANG];
  }
  return pickText(level?.explanation, lang);
}

export { REASON_GUIDANCE };
