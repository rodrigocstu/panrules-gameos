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
  PolicyRule,
  OrderedVerdict,
  ShadowReport,
  SecurityProfileGroup,
} from '../types/domain';
import { PROFILE_RANK } from '../data/constants';

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
  } else if (solution.srcAddress !== undefined && config.srcAddress !== solution.srcAddress) {
    // Address object validation (v2): solo si el nivel define srcAddress en la solución.
    reasonCode = 'ADDRESS_MISMATCH';
    resultMsg = `Address Mismatch: la dirección de origen debe ser '${solution.srcAddress}', no '${config.srcAddress ?? 'any'}'.`;
  } else if (solution.dstAddress !== undefined && config.dstAddress !== solution.dstAddress) {
    // Address object validation (v2): solo si el nivel define dstAddress en la solución.
    reasonCode = 'ADDRESS_MISMATCH';
    resultMsg = `Address Mismatch: la dirección de destino debe ser '${solution.dstAddress}', no '${config.dstAddress ?? 'any'}'.`;
  } else if (action !== solution.action) {
    resultMsg = 'Action Mismatch';
    reasonCode = 'ACTION_MISMATCH';
  } else {
    // T2.5: semántica de perfil "al menos X". solution.profile === 'any' => el
    // perfil es irrelevante (nivel 5: la regla DENY no inspecciona).
    const profileResult = checkProfile(action, profile, solution.profile, solution.profileGroup, config.profileGroup);
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
  code: Extract<ReasonCode, 'PROFILE_MISSING' | 'PROFILE_INSUFFICIENT' | 'PROFILE_COMPONENT_MISSING'>;
}

/**
 * Valida el perfil de seguridad con semántica "se requiere AL MENOS X" (T2.5).
 * Si la solución define un SecurityProfileGroup, valida cada componente requerido.
 * Devuelve null si el perfil es válido, o el fallo con su mensaje y código.
 */
function checkProfile(
  action: Action,
  profile: ProfileId,
  required: RequiredProfile,
  requiredGroup?: SecurityProfileGroup,
  playerGroup?: SecurityProfileGroup
): ProfileFailure | null {
  // El requisito de perfil solo aplica a reglas ALLOW (el tráfico que pasa es el
  // que se inspecciona). Una DENY no inspecciona.
  if (action !== 'ALLOW') return null;

  // Validación por componente de SecurityProfileGroup (v2).
  // Si la solución tiene profileGroup definido, validar cada componente requerido.
  if (requiredGroup !== undefined) {
    const components = Object.keys(requiredGroup) as (keyof SecurityProfileGroup)[];
    for (const component of components) {
      const requiredValue = requiredGroup[component];
      if (requiredValue === undefined) continue;
      const playerValue = playerGroup?.[component];
      if (playerValue !== requiredValue) {
        return {
          msg: `Profile Component Missing: el grupo de perfiles debe incluir '${requiredValue}' en '${component}'. Configura el Security Profile Group correctamente.`,
          code: 'PROFILE_COMPONENT_MISSING',
        };
      }
    }
    return null;
  }

  // Sin requisito 'any': el perfil es irrelevante (p. ej. una regla DENY no
  // necesita inspección de amenazas).
  if (required === 'any') return null;

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

// ─── Policy-Order Engine ──────────────────────────────────────────────────────

/**
 * Evalúa un conjunto de reglas ordenadas contra un Level (top-down, first-match).
 * Llama a `evaluate()` internamente para cada regla candidata.
 * Si ninguna regla matchea, devuelve implicit deny.
 */
export function evaluateOrdered(rules: PolicyRule[], level: Level): OrderedVerdict {
  const activeRules = rules.filter((r) => !r.disabled);

  for (let i = 0; i < activeRules.length; i++) {
    const rule = activeRules[i];

    // Determina si la regla matchea las zonas del paquete del nivel.
    const ruleMatchesZones =
      (rule.srcZone === 'any' || rule.srcZone === level.packet.srcZone) &&
      (rule.dstZone === 'any' || rule.dstZone === level.packet.dstZone);

    if (!ruleMatchesZones) continue;

    // La regla matchea zonas: normalizar las zonas 'any' al valor del paquete para
    // que evaluate() (que compara zonas literalmente) no devuelva ZONE_MISMATCH.
    // En PAN-OS, 'any' en una regla significa "coincide con cualquier zona"; el motor
    // interno no necesita distinguirlo de la zona concreta una vez que ya filtramos.
    const normalizedRule: PolicyConfig = {
      ...rule,
      srcZone: rule.srcZone === 'any' ? level.packet.srcZone : rule.srcZone,
      dstZone: rule.dstZone === 'any' ? level.packet.dstZone : rule.dstZone,
    };
    const verdict = evaluate(normalizedRule, level);
    return {
      ...verdict,
      matchedRuleId: rule.id,
      shadowedBy: null,
      rulesEvaluated: i + 1,
    };
  }

  // Implicit deny: ninguna regla activa matcheó el paquete.
  return {
    isWin: false,
    resultMsg: 'Implicit Deny: ninguna regla de la política coincide con este tráfico. PAN-OS bloquea por defecto.',
    finalAction: 'drop',
    terminal: false,
    outcome: 'failure',
    reasonCode: 'ZONE_MISMATCH',
    matchedRuleId: null,
    shadowedBy: null,
    rulesEvaluated: activeRules.length,
  };
}

/**
 * Detecta reglas que nunca serán alcanzadas porque una regla anterior las sombrea.
 * O(n²) — aceptable para ≤ 10 reglas.
 * Tres patrones: superset-source, superset-dest, deny-before-allow.
 */
export function detectShadowing(rules: PolicyRule[]): ShadowReport[] {
  const reports: ShadowReport[] = [];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const ruleI = rules[i];
      const ruleJ = rules[j];

      // Las reglas deshabilitadas no sombran ni son sombreadas.
      if (ruleI.disabled || ruleJ.disabled) continue;

      // Determinar si ruleI cubre el espacio de ruleJ (superconjunto).
      const srcCovers =
        ruleI.srcZone === 'any' || ruleI.srcZone === ruleJ.srcZone;
      const dstCovers =
        ruleI.dstZone === 'any' || ruleI.dstZone === ruleJ.dstZone;
      const appCovers =
        ruleI.app === 'any' || ruleI.app === ruleJ.app;

      if (!srcCovers || !dstCovers || !appCovers) continue;

      // ruleI sombrea a ruleJ. Determinar el patrón más específico.

      // Patrón deny-before-allow: ruleI es DENY y ruleJ sería ALLOW con el mismo espacio.
      if (ruleI.action === 'DENY' && ruleJ.action === 'ALLOW') {
        reports.push({
          shadowedRuleId: ruleJ.id,
          shadowingRuleId: ruleI.id,
          reason: 'deny-before-allow',
        });
        continue;
      }

      // Patrón superset-source: ruleI tiene srcZone 'any' o es superconjunto.
      if (ruleI.srcZone === 'any' && ruleJ.srcZone !== 'any') {
        reports.push({
          shadowedRuleId: ruleJ.id,
          shadowingRuleId: ruleI.id,
          reason: 'superset-source',
        });
        continue;
      }

      // Patrón superset-dest: ruleI tiene dstZone 'any' o es superconjunto.
      if (ruleI.dstZone === 'any' && ruleJ.dstZone !== 'any') {
        reports.push({
          shadowedRuleId: ruleJ.id,
          shadowingRuleId: ruleI.id,
          reason: 'superset-dest',
        });
        continue;
      }

      // Patrón superset-app: ruleI tiene app 'any' y ruleJ tiene app específico.
      if (ruleI.app === 'any' && ruleJ.app !== 'any') {
        reports.push({
          shadowedRuleId: ruleJ.id,
          shadowingRuleId: ruleI.id,
          reason: 'superset-app',
        });
        continue;
      }

      // Caso genérico: zonas y app idénticos, ruleI precede a ruleJ (sombra por orden).
      // Reportar como superset-source por convención cuando no hay diferencia de especificidad.
      reports.push({
        shadowedRuleId: ruleJ.id,
        shadowingRuleId: ruleI.id,
        reason: 'superset-source',
      });
    }
  }

  return reports;
}
