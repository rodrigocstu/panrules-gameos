/**
 * firewall-engine — lógica de decisión pura del simulador PAN-OS NGFW.
 *
 * Función `evaluate(config, level)` SIN React y SIN efectos secundarios: recibe la
 * configuración de política del jugador y el nivel, y devuelve un veredicto. El
 * componente se encarga de la animación y de pintar el resultado.
 *
 * FASE 2 / WP-3 (correcciones pedagógicas): el motor deriva el resultado de
 * `level.solution` (la fuente de verdad), valida App-ID / service / perfil con
 * semántica PAN-OS real y produce un veredicto coherente con la acción.
 *
 * T1.5: tipado con el dominio (PolicyConfig, Level, Verdict, ReasonCode).
 */

import type {
  PolicyConfig,
  Level,
  Verdict,
  ProfileId,
  RequiredProfile,
  Action,
  NatType,
  ReasonCode,
} from '../types/domain';

// Orden de severidad de perfiles de seguridad: a mayor índice, más inspección.
// PAN-OS: un Security Profile Group más estricto incluye lo que cubre el inferior.
const PROFILE_RANK: Record<ProfileId, number> = { none: 0, default: 1, strict: 2 };

export function evaluate(config: PolicyConfig, level: Level): Verdict {
  const { srcZone, dstZone, app, service, action, nat, profile } = config;
  const solution = level.solution;

  // 1. specialCheck: TODAS sus ramas son terminales (T2.4). El nivel decide el
  //    desenlace (DROPPED / WARNING / mismatch) y aquí lo clasificamos sin caer
  //    a la validación genérica.
  if (level.specialCheck) {
    const res = level.specialCheck(config);

    // DROPPED: el paquete cae por diseño. Es un acierto que BLOQUEA.
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

    // WARNING: funciona pero viola la buena práctica. El tráfico pasa.
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

    // Cualquier otra rama del specialCheck es un FALLO terminal (corrige bug #4).
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
  let reasonCode: ReasonCode | '' = '';

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
  } else {
    // T2.5: semántica de perfil "al menos X". solution.profile === 'any' => el
    // perfil es irrelevante (nivel 5: la regla DENY no inspecciona).
    const profileResult = checkProfile(action, profile, solution.profile);
    if (profileResult) {
      resultMsg = profileResult.msg;
      reasonCode = profileResult.code;
    }
  }

  // 3. NAT RULEBASE — paso SEPARADO (T2.6). Solo si la Security Policy pasó: en
  //    PAN-OS el NAT rulebase es una tabla distinta. Mantiene los dos veredictos
  //    conceptualmente separados (se puede acertar Security y fallar NAT). Solo
  //    aplica al PERMITIR: una DENY descarta el paquete antes del NAT rulebase.
  if (!reasonCode && solution.action === 'ALLOW') {
    const natResult = checkNat(nat, solution.nat);
    if (natResult) {
      resultMsg = natResult.msg;
      reasonCode = natResult.code;
    }
  }

  // 4. Veredicto final.
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

interface ProfileFailure {
  msg: string;
  code: Extract<ReasonCode, 'PROFILE_MISSING' | 'PROFILE_INSUFFICIENT'>;
}

/**
 * Valida el perfil de seguridad con semántica "se requiere AL MENOS X" (T2.5).
 * Devuelve null si el perfil es válido, o el fallo con su mensaje y código.
 */
function checkProfile(
  action: Action,
  profile: ProfileId,
  required: RequiredProfile
): ProfileFailure | null {
  // Sin requisito 'any': el perfil es irrelevante (p. ej. una regla DENY no
  // necesita inspección de amenazas).
  if (required === 'any') return null;

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

// Etiquetas legibles de cada tipo de NAT para los mensajes del NAT rulebase.
const NAT_LABEL: Record<NatType, string> = {
  NONE: 'sin NAT (No NAT)',
  SNAT: 'Source NAT (SNAT)',
  DNAT: 'Destination NAT (DNAT)',
  'DNAT+SNAT': 'U-Turn NAT (DNAT+SNAT)',
};

interface NatFailure {
  msg: string;
  code: Extract<ReasonCode, 'NAT_MISMATCH'>;
}

/**
 * Valida la regla del NAT RULEBASE de forma SEPARADA a la Security Policy (T2.6).
 * Devuelve null si el tipo de NAT coincide, o el fallo descrito en términos del
 * NAT rulebase. Distingue tres casos: falta NAT, NAT donde no debe, tipo erróneo.
 */
function checkNat(nat: NatType, required: NatType): NatFailure | null {
  if (nat === required) return null;

  const want = NAT_LABEL[required] ?? required;
  const have = NAT_LABEL[nat] ?? nat;

  // Falta NAT por completo donde se necesitaba.
  if (required !== 'NONE' && nat === 'NONE') {
    return {
      msg: `NAT Rulebase: falta la regla de NAT. La Security Policy es correcta, pero este tráfico necesita ${want} en el NAT rulebase (una tabla aparte de Security en PAN-OS).`,
      code: 'NAT_MISMATCH',
    };
  }

  // Se aplicó NAT donde no debía (tráfico interno sin traducción).
  if (required === 'NONE' && nat !== 'NONE') {
    return {
      msg: `NAT Rulebase: este tráfico no debe traducirse. Configuraste ${have}, pero la regla correcta es ${want}. El NAT rulebase es independiente de la Security Policy en PAN-OS.`,
      code: 'NAT_MISMATCH',
    };
  }

  return {
    msg: `NAT Rulebase: tipo de NAT incorrecto. Se esperaba ${want}, no ${have}. Recuerda que el NAT se configura en su propio rulebase, separado de la Security Policy.`,
    code: 'NAT_MISMATCH',
  };
}
