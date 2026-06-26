import { describe, it, expect } from 'vitest';
import { evaluate, evaluateOrdered, detectShadowing } from './firewall-engine.js';
import { LEVELS } from '../data/levels.js';

// Niveles reales del juego (extraídos a src/data/levels.js en WP-2 / T1.1).
const level1 = LEVELS[0]; // Secure Internet Access (ALLOW + SNAT)
const level2 = LEVELS[1]; // Publishing DMZ Web Server (ALLOW + DNAT)
const level3 = LEVELS[2]; // Block Non-Standard SSH (specialCheck)
const level4 = LEVELS[3]; // The Hairpin / U-Turn NAT (ALLOW + DNAT+SNAT)
const level5 = LEVELS[4]; // Data Exfiltration Attempt (DENY)

// Helper: construye una config a partir de la solución del nivel (+ overrides).
// La solución no trae `nat` siempre presente como campo de config, así que lo
// normalizamos desde solution.nat.
const configFrom = (level, overrides = {}) => ({
  srcZone: level.solution.srcZone,
  dstZone: level.solution.dstZone,
  app: level.solution.app,
  service: level.solution.service,
  action: level.solution.action,
  nat: level.solution.nat,
  profile: level.solution.profile,
  ...overrides,
});

const correctLevel1Config = configFrom(level1);

describe('evaluate() — camino feliz (nivel 1, ALLOW)', () => {
  it('aprueba la configuración correcta y deja pasar el tráfico', () => {
    const verdict = evaluate(correctLevel1Config, level1);
    expect(verdict.isWin).toBe(true);
    expect(verdict.finalAction).toBe('allow');
    expect(verdict.terminal).toBe(false);
  });
});

describe('evaluate() — mismatches (nivel 1)', () => {
  it('marca Action Mismatch si el jugador pone DENY donde se requiere ALLOW', () => {
    const verdict = evaluate({ ...correctLevel1Config, action: 'DENY' }, level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.resultMsg).toBe('Action Mismatch');
    expect(verdict.finalAction).toBe('drop');
  });

  it('marca Zone Mismatch si la zona destino es incorrecta', () => {
    const verdict = evaluate({ ...correctLevel1Config, dstZone: 'dmz' }, level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.resultMsg).toBe('Zone Mismatch');
  });

  it('marca NAT_MISMATCH si falta el SNAT (mensaje del NAT rulebase)', () => {
    const verdict = evaluate({ ...correctLevel1Config, nat: 'NONE' }, level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('NAT_MISMATCH');
    expect(verdict.resultMsg).toMatch(/NAT Rulebase/i);
  });
});

describe('evaluate() — specialCheck terminal (nivel 3)', () => {
  it('devuelve un veredicto terminal cuando application-default contradice el puerto 2222', () => {
    const verdict = evaluate(configFrom(level3, { service: 'application-default' }), level3);
    expect(verdict.terminal).toBe(true);
    expect(verdict.isWin).toBe(true);
    expect(verdict.resultMsg).toContain('DROPPED');
  });
});

describe('evaluate() — T2.1: mensaje coherente con la acción (DENY correcto)', () => {
  // Antes BUG #1: un DENY correcto devolvía "Traffic Allowed". Ahora el desenlace
  // deriva de solution.action: un acierto que BLOQUEA no muestra "permitido".
  it('nivel 5 DENY correcto: isWin true, finalAction drop, outcome block-win y mensaje de bloqueo', () => {
    const verdict = evaluate(configFrom(level5), level5);
    expect(verdict.isWin).toBe(true);
    expect(verdict.finalAction).toBe('drop');
    expect(verdict.outcome).toBe('block-win');
    expect(verdict.resultMsg).toBe('TRÁFICO BLOQUEADO (correcto)');
    expect(verdict.resultMsg).not.toMatch(/Allowed|PERMITIDO/i);
  });

  it('nivel 1 ALLOW correcto: outcome allow-win y mensaje de permitido', () => {
    const verdict = evaluate(correctLevel1Config, level1);
    expect(verdict.isWin).toBe(true);
    expect(verdict.finalAction).toBe('allow');
    expect(verdict.outcome).toBe('allow-win');
    expect(verdict.resultMsg).toBe('TRÁFICO PERMITIDO (correcto)');
  });
});

describe('evaluate() — T2.2: App-ID se compara con solution.app y "any" no es comodín', () => {
  it('FALLA si la solución pide ssl y el jugador pone App-ID any (más amplio de lo previsto)', () => {
    const verdict = evaluate(configFrom(level1, { app: 'any' }), level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('APP_MISMATCH');
    expect(verdict.resultMsg).toMatch(/any/i);
    expect(verdict.resultMsg).toContain('ssl');
  });

  it('FALLA si el App-ID elegido no coincide con solution.app', () => {
    const verdict = evaluate(configFrom(level1, { app: 'ssh' }), level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('APP_MISMATCH');
  });

  it('ACIERTA cuando el App-ID coincide exactamente con solution.app', () => {
    const verdict = evaluate(configFrom(level1, { app: 'ssl' }), level1);
    expect(verdict.isWin).toBe(true);
    expect(verdict.reasonCode).toBe('OK_ALLOW');
  });
});

describe('evaluate() — T2.3: service se valida en todos los niveles', () => {
  it('FALLA en nivel 1 si el service no coincide con solution.service', () => {
    const verdict = evaluate(configFrom(level1, { service: 'service-https' }), level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('SERVICE_MISMATCH');
    expect(verdict.resultMsg).toContain('application-default');
  });

  it('FALLA en nivel 5 (DENY) si el service no coincide, antes de evaluar la acción', () => {
    const verdict = evaluate(configFrom(level5, { service: 'any' }), level5);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('SERVICE_MISMATCH');
  });
});

describe('evaluate() — T2.4: specialCheck totalmente terminal (nivel 3)', () => {
  it('rama WARNING (service any): terminal, acierto y deja pasar (allow-win)', () => {
    const verdict = evaluate(configFrom(level3, { service: 'any' }), level3);
    expect(verdict.terminal).toBe(true);
    expect(verdict.isWin).toBe(true);
    expect(verdict.outcome).toBe('allow-win');
    expect(verdict.resultMsg).toContain('WARNING');
  });

  it('rama mismatch (service que no es application-default ni any): terminal y FALLO', () => {
    const verdict = evaluate(configFrom(level3, { service: 'service-https' }), level3);
    expect(verdict.terminal).toBe(true);
    expect(verdict.isWin).toBe(false);
    expect(verdict.outcome).toBe('failure');
    expect(verdict.reasonCode).toBe('SPECIAL_MISMATCH');
  });

  it('rama DROPPED (application-default): terminal, acierto que bloquea (block-win)', () => {
    const verdict = evaluate(configFrom(level3, { service: 'application-default' }), level3);
    expect(verdict.terminal).toBe(true);
    expect(verdict.isWin).toBe(true);
    expect(verdict.outcome).toBe('block-win');
    expect(verdict.resultMsg).toContain('DROPPED');
  });
});

describe('evaluate() — T2.5: semántica de perfil "al menos X"', () => {
  // Nivel 1 requiere solution.profile === 'default'.
  it('FALLA con mensaje "Missing" cuando se requiere default y el perfil es none', () => {
    const verdict = evaluate(configFrom(level1, { profile: 'none' }), level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('PROFILE_MISSING');
    expect(verdict.resultMsg).toMatch(/Missing/i);
  });

  it('ACIERTA cuando se requiere default y el perfil es default', () => {
    const verdict = evaluate(configFrom(level1, { profile: 'default' }), level1);
    expect(verdict.isWin).toBe(true);
  });

  it('ACIERTA cuando se requiere default y el perfil es strict (cubre de más)', () => {
    const verdict = evaluate(configFrom(level1, { profile: 'strict' }), level1);
    expect(verdict.isWin).toBe(true);
    expect(verdict.reasonCode).toBe('OK_ALLOW');
  });

  it('mensaje "insuficiente" (no "Missing") cuando hay un perfil puesto pero menor al requerido', () => {
    // Nivel artificial: requiere strict, el jugador pone default (insuficiente).
    const strictLevel = {
      ...level1,
      solution: { ...level1.solution, profile: 'strict' },
    };
    const verdict = evaluate(configFrom(strictLevel, { profile: 'default' }), strictLevel);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('PROFILE_INSUFFICIENT');
    expect(verdict.resultMsg).not.toMatch(/Missing/i);
    expect(verdict.resultMsg).toMatch(/insuficiente/i);
  });

  it('perfil irrelevante cuando solution.profile === "any" (nivel 5 DENY)', () => {
    const verdict = evaluate(configFrom(level5, { profile: 'none' }), level5);
    expect(verdict.isWin).toBe(true);
    expect(verdict.outcome).toBe('block-win');
  });
});

describe('evaluate() — T2.6: NAT rulebase validado por separado de Security', () => {
  // El NAT rulebase es una tabla aparte en PAN-OS. Un jugador puede acertar TODA
  // la Security Policy y aun así fallar el NAT, y viceversa. Estos tests aíslan
  // ese caso: Security correcta-pero-NAT-incorrecta, y NAT correcto.

  it('nivel 1 (SNAT): Security correcta pero NAT NONE => FALLA en el NAT rulebase', () => {
    // Todos los campos de Security son correctos; solo el NAT está mal.
    const verdict = evaluate(configFrom(level1, { nat: 'NONE' }), level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('NAT_MISMATCH');
    // El mensaje deja claro que falló el NAT rulebase, no la Security Policy.
    expect(verdict.resultMsg).toMatch(/NAT Rulebase/i);
    expect(verdict.resultMsg).toMatch(/SNAT/);
  });

  it('nivel 1 (SNAT): Security + NAT correctos => ACIERTA (allow-win)', () => {
    const verdict = evaluate(configFrom(level1), level1);
    expect(verdict.isWin).toBe(true);
    expect(verdict.reasonCode).toBe('OK_ALLOW');
    expect(verdict.outcome).toBe('allow-win');
  });

  it('nivel 2 (DNAT): Security correcta pero NAT SNAT => FALLA con tipo incorrecto', () => {
    const verdict = evaluate(configFrom(level2, { nat: 'SNAT' }), level2);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('NAT_MISMATCH');
    expect(verdict.resultMsg).toMatch(/DNAT/);
  });

  it('nivel 2 (DNAT): Security + NAT correctos => ACIERTA', () => {
    const verdict = evaluate(configFrom(level2), level2);
    expect(verdict.isWin).toBe(true);
    expect(verdict.reasonCode).toBe('OK_ALLOW');
  });

  it('nivel 4 (U-Turn): Security correcta pero solo DNAT => FALLA (falta el SNAT del U-Turn)', () => {
    const verdict = evaluate(configFrom(level4, { nat: 'DNAT' }), level4);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('NAT_MISMATCH');
    expect(verdict.resultMsg).toMatch(/U-Turn|DNAT\+SNAT/i);
  });

  it('nivel 4 (U-Turn): Security + NAT (DNAT+SNAT) correctos => ACIERTA', () => {
    const verdict = evaluate(configFrom(level4), level4);
    expect(verdict.isWin).toBe(true);
    expect(verdict.reasonCode).toBe('OK_ALLOW');
  });

  it('la validación de NAT corre DESPUÉS de Security: un fallo de zona se reporta antes que el NAT', () => {
    // Zona incorrecta Y NAT incorrecto: debe ganar el check de Security (zona).
    const verdict = evaluate(configFrom(level1, { dstZone: 'dmz', nat: 'NONE' }), level1);
    expect(verdict.reasonCode).toBe('ZONE_MISMATCH');
  });

  it('nivel 5 (DENY): el NAT rulebase NO se evalúa (el paquete se bloquea en Security)', () => {
    // Aunque el jugador ponga un NAT "incorrecto", una solución DENY nunca llega
    // al NAT rulebase: el veredicto es el bloqueo correcto.
    const verdict = evaluate(configFrom(level5, { nat: 'SNAT' }), level5);
    expect(verdict.isWin).toBe(true);
    expect(verdict.outcome).toBe('block-win');
    expect(verdict.reasonCode).toBe('OK_BLOCK');
  });

  it('nivel 3 (NONE): aplicar NAT donde no debe => FALLA explicando que no debe traducirse', () => {
    // Nivel 3 tiene specialCheck; lo sorteamos con un nivel derivado sin él para
    // probar el check de NAT NONE de forma aislada.
    const plainLevel3 = { ...level3, specialCheck: undefined };
    const verdict = evaluate(configFrom(plainLevel3, { nat: 'SNAT' }), plainLevel3);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('NAT_MISMATCH');
    expect(verdict.resultMsg).toMatch(/no debe traducirse/i);
  });
});

// ─── Agent 2: evaluateOrdered ─────────────────────────────────────────────────

// Fixtures de PolicyRule para los tests de evaluateOrdered y detectShadowing.
const makeRule = (id, overrides = {}) => ({
  id,
  srcZone: 'trust',
  dstZone: 'untrust',
  app: 'ssl',
  service: 'application-default',
  action: 'ALLOW',
  nat: 'SNAT',
  profile: 'default',
  disabled: false,
  ...overrides,
});

describe('evaluateOrdered() — primera regla que matchea zona+app gana', () => {
  it('primera regla ALLOW que matchea zona y app => isWin true, matchedRuleId = rule.id', () => {
    const rule = makeRule('rule-1');
    const verdict = evaluateOrdered([rule], level1);
    expect(verdict.isWin).toBe(true);
    expect(verdict.matchedRuleId).toBe('rule-1');
    expect(verdict.outcome).toBe('allow-win');
  });

  it('primera regla DENY que matchea => block-win (DENY correcto si solution es DENY)', () => {
    // Creamos un nivel cuya solución es DENY; la regla matchea y coincide con la solución.
    const denyLevel = {
      ...level5,
      solution: { ...level5.solution },
    };
    const rule = makeRule('rule-deny', {
      srcZone: denyLevel.solution.srcZone,
      dstZone: denyLevel.solution.dstZone,
      app: denyLevel.solution.app,
      service: denyLevel.solution.service,
      action: 'DENY',
      nat: denyLevel.solution.nat,
      profile: denyLevel.solution.profile,
    });
    const verdict = evaluateOrdered([rule], denyLevel);
    expect(verdict.isWin).toBe(true);
    expect(verdict.outcome).toBe('block-win');
    expect(verdict.matchedRuleId).toBe('rule-deny');
  });

  it('segunda regla matchea cuando la primera no matchea zonas', () => {
    const rule1 = makeRule('rule-1', { srcZone: 'dmz', dstZone: 'untrust' }); // no matchea level1 (trust->untrust)
    const rule2 = makeRule('rule-2'); // matchea level1
    const verdict = evaluateOrdered([rule1, rule2], level1);
    expect(verdict.matchedRuleId).toBe('rule-2');
    expect(verdict.rulesEvaluated).toBe(2);
  });

  it('regla deshabilitada se salta', () => {
    const rule1 = makeRule('rule-disabled', { disabled: true });
    const rule2 = makeRule('rule-active');
    const verdict = evaluateOrdered([rule1, rule2], level1);
    expect(verdict.matchedRuleId).toBe('rule-active');
    // rulesEvaluated no cuenta la deshabilitada en el índice, pero sí entre activas
    expect(verdict.rulesEvaluated).toBe(1);
  });

  it('ninguna regla matchea => implicit deny (isWin false, ZONE_MISMATCH)', () => {
    const rule = makeRule('rule-dmz', { srcZone: 'dmz', dstZone: 'trust' }); // nunca matchea level1
    const verdict = evaluateOrdered([rule], level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.matchedRuleId).toBeNull();
    expect(verdict.reasonCode).toBe('ZONE_MISMATCH');
    expect(verdict.rulesEvaluated).toBe(1);
  });

  it('regla any-any matchea cualquier paquete', () => {
    const rule = makeRule('rule-any', { srcZone: 'any', dstZone: 'any' });
    const verdict = evaluateOrdered([rule], level1);
    expect(verdict.matchedRuleId).toBe('rule-any');
    expect(verdict.isWin).toBe(true);
  });

  it('regla any-any matchea level2 (trust->dmz con DNAT)', () => {
    const rule = makeRule('rule-any', {
      srcZone: 'any',
      dstZone: 'any',
      app: level2.solution.app,
      service: level2.solution.service,
      action: level2.solution.action,
      nat: level2.solution.nat,
      profile: level2.solution.profile,
    });
    const verdict = evaluateOrdered([rule], level2);
    expect(verdict.isWin).toBe(true);
    expect(verdict.matchedRuleId).toBe('rule-any');
  });

  it('evaluateOrdered con una sola regla = misma lógica que evaluate()', () => {
    const rule = makeRule('single');
    const ordered = evaluateOrdered([rule], level1);
    const direct = evaluate(rule, level1);
    expect(ordered.isWin).toBe(direct.isWin);
    expect(ordered.outcome).toBe(direct.outcome);
    expect(ordered.reasonCode).toBe(direct.reasonCode);
  });

  it('orden importa: deny-deny-allow => primera deny gana si matchea', () => {
    const deny1 = makeRule('deny-1', { action: 'DENY' });
    const deny2 = makeRule('deny-2', { action: 'DENY' });
    const allow3 = makeRule('allow-3', { action: 'ALLOW' });
    // level1 espera ALLOW; deny1 matchea zonas primero y falla (ACTION_MISMATCH)
    const verdict = evaluateOrdered([deny1, deny2, allow3], level1);
    expect(verdict.matchedRuleId).toBe('deny-1');
    // la regla matchea pero la acción no coincide con la solución => fallo
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('ACTION_MISMATCH');
  });

  it('level con specialCheck: el resultado de specialCheck se devuelve normalmente', () => {
    // level3 tiene specialCheck; crear una regla que matchee sus zonas
    const rule = makeRule('rule-l3', {
      srcZone: level3.solution.srcZone,
      dstZone: level3.solution.dstZone,
      app: level3.solution.app,
      service: 'application-default', // activa el specialCheck DROPPED branch
      action: level3.solution.action,
      nat: level3.solution.nat,
      profile: level3.solution.profile,
    });
    const verdict = evaluateOrdered([rule], level3);
    expect(verdict.terminal).toBe(true);
    expect(verdict.isWin).toBe(true);
    expect(verdict.outcome).toBe('block-win');
    expect(verdict.matchedRuleId).toBe('rule-l3');
  });

  it('rulesEvaluated cuenta correctamente con múltiples reglas activas no matching', () => {
    const r1 = makeRule('r1', { srcZone: 'dmz' }); // no matchea level1
    const r2 = makeRule('r2', { srcZone: 'dmz' }); // no matchea level1
    const r3 = makeRule('r3', { srcZone: 'dmz' }); // no matchea level1
    const verdict = evaluateOrdered([r1, r2, r3], level1);
    expect(verdict.matchedRuleId).toBeNull();
    expect(verdict.rulesEvaluated).toBe(3);
  });

  it('lista vacía de reglas => implicit deny', () => {
    const verdict = evaluateOrdered([], level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.matchedRuleId).toBeNull();
    expect(verdict.rulesEvaluated).toBe(0);
  });

  it('regla con app any matchea cuando la regla cubre zonas del paquete', () => {
    const rule = makeRule('rule-app-any', {
      app: 'any',
      // servicio no coincide con la solución de level1 (application-default)
      // pero el matcheo de zonas sí se da, luego evaluate valida el resto
    });
    const verdict = evaluateOrdered([rule], level1);
    // matchea zonas y llama evaluate; el resultado depende de evaluate interno
    expect(verdict.matchedRuleId).toBe('rule-app-any');
  });

  it('shadowedBy es null en evaluateOrdered (no detecta shadow, solo evalúa orden)', () => {
    const rule = makeRule('r1');
    const verdict = evaluateOrdered([rule], level1);
    expect(verdict.shadowedBy).toBeNull();
  });

  it('dos reglas, primera matchea zonas pero falla app => esa regla gana (APP_MISMATCH)', () => {
    const r1 = makeRule('r1', { app: 'dns' }); // matchea zonas, falla app
    const r2 = makeRule('r2'); // nunca alcanzada
    const verdict = evaluateOrdered([r1, r2], level1);
    expect(verdict.matchedRuleId).toBe('r1');
    expect(verdict.reasonCode).toBe('APP_MISMATCH');
  });

  it('solo las reglas deshabilitadas => implicit deny', () => {
    const rule = makeRule('disabled-only', { disabled: true });
    const verdict = evaluateOrdered([rule], level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.matchedRuleId).toBeNull();
    expect(verdict.rulesEvaluated).toBe(0);
  });

  it('regla con srcZone any y dstZone específica matchea si dstZone del paquete coincide', () => {
    const rule = makeRule('r-partial', {
      srcZone: 'any',
      dstZone: 'untrust', // level1.packet.dstZone es untrust
    });
    const verdict = evaluateOrdered([rule], level1);
    expect(verdict.matchedRuleId).toBe('r-partial');
  });

  it('regla con srcZone específica y dstZone any matchea si srcZone del paquete coincide', () => {
    const rule = makeRule('r-src-specific', {
      srcZone: 'trust', // level1.packet.srcZone es trust
      dstZone: 'any',
    });
    const verdict = evaluateOrdered([rule], level1);
    expect(verdict.matchedRuleId).toBe('r-src-specific');
  });

  it('regla con srcZone incorrecta no matchea aunque dstZone sea correcta', () => {
    const rule = makeRule('r-bad-src', { srcZone: 'guest', dstZone: 'untrust' });
    const verdict = evaluateOrdered([rule], level1);
    expect(verdict.matchedRuleId).toBeNull();
  });
});

// ─── Agent 2: detectShadowing ─────────────────────────────────────────────────

describe('detectShadowing() — detección de reglas sombreadas', () => {
  it('array vacío => []', () => {
    expect(detectShadowing([])).toEqual([]);
  });

  it('una sola regla => []', () => {
    const rule = makeRule('solo');
    expect(detectShadowing([rule])).toEqual([]);
  });

  it('any-any antes de regla específica => superset-source (o superset-dest)', () => {
    const r1 = makeRule('r1', { srcZone: 'any', dstZone: 'any' });
    const r2 = makeRule('r2', { srcZone: 'trust', dstZone: 'untrust' });
    const reports = detectShadowing([r1, r2]);
    expect(reports).toHaveLength(1);
    expect(reports[0].shadowedRuleId).toBe('r2');
    expect(reports[0].shadowingRuleId).toBe('r1');
  });

  it('deny before allow con misma zona/app => deny-before-allow', () => {
    const r1 = makeRule('r-deny', { action: 'DENY' });
    const r2 = makeRule('r-allow', { action: 'ALLOW' });
    // mismas zonas y app => r1 sombrea a r2
    const reports = detectShadowing([r1, r2]);
    expect(reports).toHaveLength(1);
    expect(reports[0].reason).toBe('deny-before-allow');
    expect(reports[0].shadowedRuleId).toBe('r-allow');
    expect(reports[0].shadowingRuleId).toBe('r-deny');
  });

  it('dos reglas con zonas distintas => no shadow', () => {
    const r1 = makeRule('r1', { srcZone: 'trust', dstZone: 'untrust' });
    const r2 = makeRule('r2', { srcZone: 'dmz', dstZone: 'trust' });
    expect(detectShadowing([r1, r2])).toEqual([]);
  });

  it('regla i con zona específica no sombrea regla j con zona diferente', () => {
    const r1 = makeRule('r1', { srcZone: 'guest', dstZone: 'untrust' });
    const r2 = makeRule('r2', { srcZone: 'trust', dstZone: 'untrust' });
    expect(detectShadowing([r1, r2])).toEqual([]);
  });

  it('regla deshabilitada no sombrea', () => {
    const r1 = makeRule('r-disabled', { disabled: true });
    const r2 = makeRule('r-active');
    const reports = detectShadowing([r1, r2]);
    expect(reports).toEqual([]);
  });

  it('regla deshabilitada no es sombreada', () => {
    const r1 = makeRule('r-active');
    const r2 = makeRule('r-disabled', { disabled: true });
    const reports = detectShadowing([r1, r2]);
    expect(reports).toEqual([]);
  });

  it('superset-dest: r1 con dstZone any sombrea r2 con dstZone específica', () => {
    const r1 = makeRule('r1', { srcZone: 'trust', dstZone: 'any', action: 'ALLOW' });
    const r2 = makeRule('r2', { srcZone: 'trust', dstZone: 'untrust', action: 'ALLOW' });
    const reports = detectShadowing([r1, r2]);
    expect(reports).toHaveLength(1);
    expect(reports[0].reason).toBe('superset-dest');
  });

  it('superset-app: r1 con app any sombrea r2 con app específico (mismas zonas)', () => {
    const r1 = makeRule('r1', { app: 'any', action: 'ALLOW' });
    const r2 = makeRule('r2', { app: 'ssl', action: 'ALLOW' });
    const reports = detectShadowing([r1, r2]);
    expect(reports).toHaveLength(1);
    expect(reports[0].reason).toBe('superset-app');
  });

  it('deny-before-allow con srcZone any: cubre el espacio completo de r2', () => {
    const r1 = makeRule('r-deny-any', { srcZone: 'any', dstZone: 'any', app: 'any', action: 'DENY' });
    const r2 = makeRule('r-allow-specific', { action: 'ALLOW' });
    const reports = detectShadowing([r1, r2]);
    expect(reports).toHaveLength(1);
    expect(reports[0].reason).toBe('deny-before-allow');
  });
});

// ─── Agent 2: Address Object Validation ──────────────────────────────────────

describe('evaluate() — address object validation (v2)', () => {
  // Nivel artificial con srcAddress y dstAddress en la solución.
  const addrLevel = {
    ...level1,
    solution: {
      ...level1.solution,
      srcAddress: 'group-trust-clients',
      dstAddress: 'addr-web-server',
    },
  };

  it('config con srcAddress correcto y dstAddress correcto => ACIERTA', () => {
    const cfg = configFrom(addrLevel, {
      srcAddress: 'group-trust-clients',
      dstAddress: 'addr-web-server',
    });
    const verdict = evaluate(cfg, addrLevel);
    expect(verdict.isWin).toBe(true);
    expect(verdict.reasonCode).toBe('OK_ALLOW');
  });

  it('config con srcAddress incorrecto => ADDRESS_MISMATCH', () => {
    const cfg = configFrom(addrLevel, {
      srcAddress: 'addr-dc',
      dstAddress: 'addr-web-server',
    });
    const verdict = evaluate(cfg, addrLevel);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('ADDRESS_MISMATCH');
    expect(verdict.resultMsg).toMatch(/group-trust-clients/);
  });

  it('config con dstAddress incorrecto => ADDRESS_MISMATCH', () => {
    const cfg = configFrom(addrLevel, {
      srcAddress: 'group-trust-clients',
      dstAddress: 'addr-db-server', // incorrecto
    });
    const verdict = evaluate(cfg, addrLevel);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('ADDRESS_MISMATCH');
    expect(verdict.resultMsg).toMatch(/addr-web-server/);
  });

  it('config sin srcAddress cuando la solución lo requiere => ADDRESS_MISMATCH', () => {
    const cfg = configFrom(addrLevel, {
      dstAddress: 'addr-web-server',
      // srcAddress ausente => undefined !== 'group-trust-clients'
    });
    const verdict = evaluate(cfg, addrLevel);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('ADDRESS_MISMATCH');
  });

  it('level sin solution.srcAddress => NO valida address (comportamiento original)', () => {
    // level1 no tiene srcAddress en solution; la validación no aplica.
    const cfg = configFrom(level1, { srcAddress: 'addr-dc' });
    const verdict = evaluate(cfg, level1);
    // No debería fallar por address, sino aprobar normalmente.
    expect(verdict.isWin).toBe(true);
    expect(verdict.reasonCode).toBe('OK_ALLOW');
  });

  it('level sin solution.dstAddress => NO valida dstAddress', () => {
    const cfg = configFrom(level1, { dstAddress: 'addr-db-server' });
    const verdict = evaluate(cfg, level1);
    expect(verdict.isWin).toBe(true);
  });

  it('address mismatch se detecta ANTES de action mismatch (orden de validación)', () => {
    const cfg = configFrom(addrLevel, {
      srcAddress: 'addr-dc', // incorrecto
      action: 'DENY',        // también incorrecto
    });
    const verdict = evaluate(cfg, addrLevel);
    // ADDRESS_MISMATCH debe ganar (se valida antes de action)
    expect(verdict.reasonCode).toBe('ADDRESS_MISMATCH');
  });

  it('address mismatch se detecta DESPUÉS de service mismatch (orden service > address)', () => {
    const cfg = configFrom(addrLevel, {
      service: 'service-https',  // incorrecto (service antes de address en la cadena)
      srcAddress: 'addr-dc',     // también incorrecto
    });
    const verdict = evaluate(cfg, addrLevel);
    expect(verdict.reasonCode).toBe('SERVICE_MISMATCH');
  });

  it('nivel con solo dstAddress en solution: ignora srcAddress del config', () => {
    const dstOnlyLevel = {
      ...level1,
      solution: {
        ...level1.solution,
        dstAddress: 'addr-web-server',
        // srcAddress no definido
      },
    };
    const cfg = configFrom(dstOnlyLevel, {
      srcAddress: 'addr-dc', // irrelevante (no hay solution.srcAddress)
      dstAddress: 'addr-web-server',
    });
    const verdict = evaluate(cfg, dstOnlyLevel);
    expect(verdict.isWin).toBe(true);
  });

  it('nivel con solution.srcAddress = "any" => config debe pasar "any"', () => {
    const anyAddrLevel = {
      ...level1,
      solution: {
        ...level1.solution,
        srcAddress: 'any',
      },
    };
    const cfg = configFrom(anyAddrLevel, { srcAddress: 'any' });
    const verdict = evaluate(cfg, anyAddrLevel);
    expect(verdict.isWin).toBe(true);
  });
});

// ─── Agent 2: Profile Component Validation ───────────────────────────────────

describe('evaluate() — profile component validation (v2)', () => {
  // Nivel artificial con profileGroup en la solución.
  const groupLevel = {
    ...level1,
    solution: {
      ...level1.solution,
      profile: 'any', // irrelevante cuando profileGroup está set
      profileGroup: { antivirus: 'av-only' },
    },
  };

  it('config con profileGroup correcto (antivirus: av-only) => ACIERTA', () => {
    const cfg = configFrom(groupLevel, {
      profileGroup: { antivirus: 'av-only' },
    });
    const verdict = evaluate(cfg, groupLevel);
    expect(verdict.isWin).toBe(true);
    expect(verdict.reasonCode).toBe('OK_ALLOW');
  });

  it('config sin el componente antivirus requerido => PROFILE_COMPONENT_MISSING', () => {
    const cfg = configFrom(groupLevel, {
      profileGroup: {}, // sin antivirus
    });
    const verdict = evaluate(cfg, groupLevel);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('PROFILE_COMPONENT_MISSING');
    expect(verdict.resultMsg).toMatch(/antivirus/);
  });

  it('config con antivirus incorrecto => PROFILE_COMPONENT_MISSING', () => {
    const cfg = configFrom(groupLevel, {
      profileGroup: { antivirus: 'strict' }, // diferente al requerido
    });
    const verdict = evaluate(cfg, groupLevel);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('PROFILE_COMPONENT_MISSING');
  });

  it('config sin profileGroup cuando se requiere => PROFILE_COMPONENT_MISSING', () => {
    const cfg = configFrom(groupLevel);
    // profileGroup ausente => undefined; antivirus en groupLevel lo requiere
    const verdict = evaluate(cfg, groupLevel);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('PROFILE_COMPONENT_MISSING');
  });

  it('level sin solution.profileGroup => usa rank como siempre (no regresión)', () => {
    // level1 no tiene profileGroup; debe funcionar exactamente como antes.
    const cfg = configFrom(level1);
    const verdict = evaluate(cfg, level1);
    expect(verdict.isWin).toBe(true);
    expect(verdict.reasonCode).toBe('OK_ALLOW');
  });

  it('level sin profileGroup y perfil insuficiente => PROFILE_INSUFFICIENT (no regresión)', () => {
    const strictLevel = { ...level1, solution: { ...level1.solution, profile: 'strict' } };
    const cfg = configFrom(strictLevel, { profile: 'default' });
    const verdict = evaluate(cfg, strictLevel);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('PROFILE_INSUFFICIENT');
  });

  it('profileGroup con múltiples componentes: todos correctos => ACIERTA', () => {
    const multiGroupLevel = {
      ...level1,
      solution: {
        ...level1.solution,
        profile: 'any',
        profileGroup: { antivirus: 'av-only', vulnerability: 'vuln-only' },
      },
    };
    const cfg = configFrom(multiGroupLevel, {
      profileGroup: { antivirus: 'av-only', vulnerability: 'vuln-only' },
    });
    const verdict = evaluate(cfg, multiGroupLevel);
    expect(verdict.isWin).toBe(true);
  });

  it('profileGroup con múltiples componentes: falta vulnerability => PROFILE_COMPONENT_MISSING', () => {
    const multiGroupLevel = {
      ...level1,
      solution: {
        ...level1.solution,
        profile: 'any',
        profileGroup: { antivirus: 'av-only', vulnerability: 'vuln-only' },
      },
    };
    const cfg = configFrom(multiGroupLevel, {
      profileGroup: { antivirus: 'av-only' }, // falta vulnerability
    });
    const verdict = evaluate(cfg, multiGroupLevel);
    expect(verdict.isWin).toBe(false);
    expect(verdict.reasonCode).toBe('PROFILE_COMPONENT_MISSING');
    expect(verdict.resultMsg).toMatch(/vulnerability/);
  });

  it('profileGroup validation se salta para DENY (action check antes de profile)', () => {
    // level5 es DENY con profile any. Creamos uno con profileGroup pero acción DENY.
    const denyGroupLevel = {
      ...level5,
      solution: {
        ...level5.solution,
        profileGroup: { antivirus: 'av-only' },
      },
    };
    const cfg = configFrom(denyGroupLevel);
    // Una regla DENY no inspecciona, la validación de perfil no aplica.
    const verdict = evaluate(cfg, denyGroupLevel);
    expect(verdict.isWin).toBe(true);
    expect(verdict.outcome).toBe('block-win');
  });

  it('message de PROFILE_COMPONENT_MISSING incluye nombre del componente y valor requerido', () => {
    const cfg = configFrom(groupLevel, { profileGroup: {} });
    const verdict = evaluate(cfg, groupLevel);
    expect(verdict.resultMsg).toMatch(/av-only/);
    expect(verdict.resultMsg).toMatch(/antivirus/);
  });
});
