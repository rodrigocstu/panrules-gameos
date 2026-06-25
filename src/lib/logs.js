// Construcción del registro de tráfico que se muestra en el panel de logs.
// Lógica de dominio pura (sin React), reutilizable y testeable.

/**
 * @param {Object} level   nivel actual (aporta el paquete observado).
 * @param {'allow'|'drop'} effect  efecto final sobre el paquete.
 * @param {string} reason  mensaje del veredicto.
 */
export function createLog(level, effect, reason) {
  return {
    id: Date.now(),
    time: new Date().toLocaleTimeString(),
    src: level.packet.srcIp,
    dst: level.packet.dstIp,
    app: level.packet.app,
    action: effect.toUpperCase(),
    bytes: effect === 'allow' ? Math.floor(Math.random() * 5000) + 500 : 0,
    reason,
    flags: effect === 'allow' ? '0x00' : '0xBAD',
    country: 'US -> US',
  };
}
