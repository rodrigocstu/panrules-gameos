/**
 * firewall-engine — lógica de decisión pura del simulador PAN-OS NGFW.
 *
 * Función `evaluate(config, level)` SIN React y SIN efectos secundarios: recibe la
 * configuración de política del jugador y el nivel, y devuelve un veredicto. El
 * componente se encarga de la animación y de pintar el resultado.
 *
 * IMPORTANTE: esta extracción reproduce FIELMENTE el comportamiento actual de
 * `evaluateTraffic` en App.jsx, incluidos los bugs documentados en CLAUDE.md
 * (§Invariantes). NO corrige nada aquí: las correcciones pedagógicas (FASE 2 / WP-3)
 * llegan con sus propios tests. El objetivo de WP-1 es "refactor sin cambiar
 * comportamiento" + cobertura mínima de tests.
 *
 * @typedef {Object} PolicyConfig
 * @property {string} srcZone
 * @property {string} dstZone
 * @property {string} app
 * @property {string} service
 * @property {'ALLOW'|'DENY'} action
 * @property {string} nat
 * @property {string} profile
 *
 * @typedef {Object} Verdict
 * @property {boolean} isWin      ¿el jugador acertó el escenario?
 * @property {string}  resultMsg  mensaje a mostrar / loguear
 * @property {'allow'|'drop'} finalAction  destino final del paquete
 * @property {boolean} terminal   true si vino de specialCheck (no animar al destino)
 */

/**
 * @param {PolicyConfig} config
 * @param {Object} level
 * @returns {Verdict}
 */
export function evaluate(config, level) {
  const { srcZone, dstZone, app, action, nat, profile } = config;

  // 1. specialCheck: ramas terminales (DROPPED / WARNING).
  //    NOTA: la rama "Configuration mismatch" cae a propósito a la validación
  //    genérica de abajo — esto reproduce el bug #4 (terminalidad incompleta),
  //    que se corrige en WP-3 (T2.4).
  if (level.specialCheck) {
    const res = level.specialCheck(config);
    if (res.msg.includes('DROPPED') || res.msg.includes('WARNING')) {
      return { isWin: true, resultMsg: res.msg, finalAction: 'drop', terminal: true };
    }
  }

  // 2. Cadena de validación genérica (orden idéntico al original).
  let logicPassed = true;
  let resultMsg = '';

  if (srcZone !== level.packet.srcZone || dstZone !== level.packet.dstZone) {
    logicPassed = false;
    resultMsg = 'Zone Mismatch';
  } else if (app !== 'any' && app !== level.packet.app) {
    // Bug #2: compara contra packet.app (no solution.app) y 'any' siempre pasa.
    logicPassed = false;
    resultMsg = 'App-ID Mismatch';
  } else if (action !== level.solution.action) {
    logicPassed = false;
    resultMsg = 'Action Mismatch';
  } else if (action === 'ALLOW' && nat !== level.solution.nat) {
    logicPassed = false;
    resultMsg = 'NAT Mismatch';
  } else if (
    action === 'ALLOW' &&
    level.solution.profile &&
    profile !== level.solution.profile &&
    profile !== 'strict'
  ) {
    // Bug #5: 'strict' siempre aprueba; mensaje "Missing" aunque haya perfil puesto.
    logicPassed = false;
    resultMsg = 'Security Profile Missing! (Threat inspection required)';
  }

  // 3. Veredicto final.
  if (logicPassed) {
    // Bug #1: el mensaje de éxito está hardcodeado a "Traffic Allowed" aunque la
    // solución sea DENY. El finalAction sí respeta la acción.
    return {
      isWin: true,
      resultMsg: 'Traffic Allowed',
      finalAction: action === 'DENY' ? 'drop' : 'allow',
      terminal: false,
    };
  }

  return {
    isWin: false,
    resultMsg: resultMsg || 'Incorrect Configuration',
    finalAction: 'drop',
    terminal: false,
  };
}
