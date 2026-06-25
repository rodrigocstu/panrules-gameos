/**
 * explanations — resuelve la microlección pedagógica a mostrar en el resultado.
 *
 * Función pura `resolveExplanation(level, reasonCode)` SIN React: dado un nivel y el
 * `reasonCode` estable del veredicto del motor, devuelve el texto del "por qué"
 * (T2.7) que el ExplanationPanel renderiza bajo el veredicto.
 *
 * Estrategia (en orden de prioridad):
 *  1. Si el `reasonCode` corresponde a un fallo concreto de la Security Policy o del
 *     NAT rulebase, devolvemos una guía específica de ese fallo (REASON_GUIDANCE):
 *     enseña el concepto PAN-OS detrás del error, no el código.
 *  2. En cualquier otro caso (acierto, o fallo sin guía específica) devolvemos la
 *     `explanation` del nivel: la microlección del concepto central del escenario.
 *
 * La `explanation` por nivel es el MÍNIMO; la guía por reasonCode es valor añadido
 * para los fallos más didácticos. Todo el texto está en español claro (PCNSE).
 */

// Guía pedagógica por código de fallo. Cada entrada es 2-3 frases que citan el
// comportamiento PAN-OS real, no el código de error. Solo cubre fallos genéricos
// (no terminales / no por nivel); el resto cae a `level.explanation`.
const REASON_GUIDANCE = {
  ZONE_MISMATCH:
    'En PAN-OS la Security Policy hace match por zona origen y zona destino (no por interfaz). Las zonas de la regla deben coincidir con las del paquete; recuerda que en escenarios con NAT la zona destino es la post-NAT (la que resuelve el route-lookup), aunque la IP destino siga siendo la pública pre-NAT.',
  APP_MISMATCH:
    'App-ID identifica la aplicación real inspeccionando el contenido, no el puerto. La regla debe declarar exactamente la aplicación del escenario; usar App-ID "any" abre la regla a más tráfico del previsto y es una mala práctica de mínimo privilegio.',
  SERVICE_MISMATCH:
    'El campo Service controla en qué puertos se permite la aplicación. "application-default" restringe cada App-ID a sus puertos estándar; elegir otro servicio cambia qué puertos hacen match y por tanto el resultado de la regla.',
  ACTION_MISMATCH:
    'La acción (allow / deny) determina el destino del paquete cuando la regla hace match. Debe derivarse de la intención del escenario: si el tráfico es legítimo, allow con su perfil; si es malicioso o no deseado, deny para descartarlo en la propia Security Policy.',
  PROFILE_MISSING:
    'En PAN-OS los Security Profiles (Antivirus, Anti-Spyware, etc.) solo inspeccionan el tráfico que la regla PERMITE. Una regla allow sin perfil deja pasar el tráfico sin inspección de amenazas; por eso este escenario exige al menos el perfil indicado.',
  PROFILE_INSUFFICIENT:
    'Un Security Profile más estricto cubre todo lo que cubre uno inferior. El perfil elegido no alcanza el nivel de inspección que pide el escenario: debes aplicar al menos el perfil requerido para proteger el tráfico permitido.',
  NAT_MISMATCH:
    'El NAT Rulebase es una tabla independiente de la Security Policy en PAN-OS. Puedes acertar toda la regla de seguridad y aun así fallar la traducción: el tipo de NAT (SNAT / DNAT / U-Turn) debe coincidir con lo que el escenario necesita, configurado en su propio rulebase.',
};

/**
 * @param {Object} level                  el nivel actual (con `explanation`).
 * @param {string|undefined} reasonCode   reasonCode del veredicto del motor.
 * @returns {string} el texto de la microlección a mostrar (siempre no vacío si el
 *                   nivel define `explanation`).
 */
export function resolveExplanation(level, reasonCode) {
  if (reasonCode && REASON_GUIDANCE[reasonCode]) {
    return REASON_GUIDANCE[reasonCode];
  }
  return level?.explanation ?? '';
}

export { REASON_GUIDANCE };
