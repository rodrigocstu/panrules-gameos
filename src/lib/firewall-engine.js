/**
 * firewall-engine — lógica de decisión pura del simulador PAN-OS NGFW.
 *
 * Función `evaluate(config, level)` SIN React y SIN efectos secundarios: recibe la
 * configuración de política del jugador y el nivel, y devuelve un veredicto. El
 * componente se encarga de la animación y de pintar el resultado.
 *
 * FASE 2 / WP-3 (correcciones pedagógicas): el motor ahora deriva el resultado de
 * `level.solution` (la fuente de verdad), valida App-ID / service / perfil con
 * semántica PAN-OS real y produce un veredicto coherente con la acción. Los bugs
 * #1–#5 (CLAUDE.md §Invariantes) quedan corregidos.
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
 * @typedef {'allow-win'|'block-win'|'failure'} Outcome
 *
 * @typedef {Object} Verdict
 * @property {boolean} isWin       ¿el jugador acertó el escenario?
 * @property {string}  resultMsg   mensaje a mostrar / loguear
 * @property {'allow'|'drop'} finalAction  destino final del paquete
 * @property {boolean} terminal    true si vino de specialCheck (no animar al destino)
 * @property {Outcome} outcome     clasificación del resultado para la UI/overlay:
 *                                  'allow-win'  = acierto y el tráfico pasa,
 *                                  'block-win'  = acierto y el tráfico se bloquea,
 *                                  'failure'    = configuración incorrecta.
 * @property {string}  reasonCode  código estable de la rama (para tests/i18n).
 */

// Orden de severidad de perfiles de seguridad: a mayor índice, más inspección.
// PAN-OS: un Security Profile Group más estricto incluye lo que cubre el inferior.
const PROFILE_RANK = { none: 0, default: 1, strict: 2 };

/**
 * @param {PolicyConfig} config
 * @param {Object} level
 * @returns {Verdict}
 */
export function evaluate(config, level) {
  const { srcZone, dstZone, app, service, action, nat, profile } = config;
  const solution = level.solution;

  // 1. specialCheck: TODAS sus ramas son terminales (T2.4). El nivel decide el
  //    desenlace (DROPPED / WARNING / mismatch) y aquí lo clasificamos sin caer
  //    a la validación genérica.
  if (level.specialCheck) {
    const res = level.specialCheck(config);

    // DROPPED: el paquete cae por diseño (p. ej. App-ID 'ssh' contradice
    // application-default en puerto no estándar). Es un acierto que BLOQUEA.
    if (res.msg.includes('DROPPED')) {
      return {
        isWin: true,
        resultMsg: res.msg,
        finalAction: 'drop',
        terminal: true,
        outcome: 'block-win',
        reasonCode: 'SPECIAL_DROPPED',
      };
    }

    // WARNING: funciona pero viola la buena práctica. El tráfico pasa, así que
    // se registra como acierto-con-aviso (allow-win) pero terminal.
    if (res.msg.includes('WARNING')) {
      return {
        isWin: true,
        resultMsg: res.msg,
        finalAction: 'allow',
        terminal: true,
        outcome: 'allow-win',
        reasonCode: 'SPECIAL_WARNING',
      };
    }

    // Cualquier otra rama del specialCheck (p. ej. "Configuration mismatch") es
    // un FALLO terminal: no se delega a la validación genérica (corrige bug #4).
    return {
      isWin: false,
      resultMsg: res.msg || 'Incorrect Configuration',
      finalAction: 'drop',
      terminal: true,
      outcome: 'failure',
      reasonCode: 'SPECIAL_MISMATCH',
    };
  }

  // 2. Cadena de validación genérica (orden de prioridad PAN-OS).
  let resultMsg = '';
  let reasonCode = '';

  if (srcZone !== level.packet.srcZone || dstZone !== level.packet.dstZone) {
    resultMsg = 'Zone Mismatch';
    reasonCode = 'ZONE_MISMATCH';
  } else if (app !== solution.app) {
    // T2.2: se compara contra solution.app (no packet.app). 'any' NO es comodín
    // gratuito: una política con App-ID 'any' es más amplia que la intención.
    reasonCode = 'APP_MISMATCH';
    resultMsg =
      app === 'any'
        ? `App-ID 'any' es demasiado amplio: este escenario requiere App-ID '${solution.app}'. Una regla en 'any' permite más de lo previsto.`
        : `App-ID Mismatch: se esperaba '${solution.app}', no '${app}'.`;
  } else if (service !== solution.service) {
    // T2.3: el service se valida en TODOS los niveles, no solo en specialCheck.
    reasonCode = 'SERVICE_MISMATCH';
    resultMsg = `Service Mismatch: se esperaba '${solution.service}', no '${service}'.`;
  } else if (action !== solution.action) {
    resultMsg = 'Action Mismatch';
    reasonCode = 'ACTION_MISMATCH';
  } else if (action === 'ALLOW' && nat !== solution.nat) {
    resultMsg = 'NAT Mismatch';
    reasonCode = 'NAT_MISMATCH';
  } else {
    // T2.5: semántica de perfil "al menos X". solution.profile === 'any' => el
    // perfil es irrelevante (nivel 5: la regla DENY no inspecciona).
    const profileResult = checkProfile(action, profile, solution.profile);
    if (profileResult) {
      resultMsg = profileResult.msg;
      reasonCode = profileResult.code;
    }
  }

  // 3. Veredicto final.
  if (!reasonCode) {
    // T2.1: el desenlace se deriva de la acción de la solución, no está
    // hardcodeado. Un DENY correcto BLOQUEA (block-win), un ALLOW correcto pasa.
    const blocks = solution.action === 'DENY';
    return {
      isWin: true,
      resultMsg: blocks ? 'TRÁFICO BLOQUEADO (correcto)' : 'TRÁFICO PERMITIDO (correcto)',
      finalAction: blocks ? 'drop' : 'allow',
      terminal: false,
      outcome: blocks ? 'block-win' : 'allow-win',
      reasonCode: blocks ? 'OK_BLOCK' : 'OK_ALLOW',
    };
  }

  return {
    isWin: false,
    resultMsg: resultMsg || 'Incorrect Configuration',
    finalAction: 'drop',
    terminal: false,
    outcome: 'failure',
    reasonCode,
  };
}

/**
 * Valida el perfil de seguridad con semántica "se requiere AL MENOS X" (T2.5).
 * Devuelve null si el perfil es válido, o `{ msg, code }` con el fallo.
 *
 * @param {'ALLOW'|'DENY'} action
 * @param {string} profile          perfil elegido por el jugador
 * @param {string|undefined} required  solution.profile ('none'|'default'|'strict'|'any')
 */
function checkProfile(action, profile, required) {
  // Sin requisito o requisito 'any': el perfil es irrelevante (p. ej. una regla
  // DENY no necesita inspección de amenazas).
  if (!required || required === 'any') return null;

  // El requisito de perfil solo aplica a reglas ALLOW (el tráfico que pasa es el
  // que se inspecciona). Una DENY no inspecciona.
  if (action !== 'ALLOW') return null;

  const have = PROFILE_RANK[profile] ?? 0;
  const need = PROFILE_RANK[required] ?? 0;

  if (have >= need) return null;

  // Tres mensajes distintos (T2.5): falta perfil vs. insuficiente.
  if (profile === 'none') {
    return {
      msg: `Security Profile Missing! Este tráfico requiere al menos el perfil '${required}' para inspección de amenazas.`,
      code: 'PROFILE_MISSING',
    };
  }
  return {
    msg: `Perfil insuficiente: '${profile}' no cubre la inspección requerida. Se necesita al menos '${required}'.`,
    code: 'PROFILE_INSUFFICIENT',
  };
}
