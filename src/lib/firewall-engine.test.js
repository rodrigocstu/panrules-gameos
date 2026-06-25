import { describe, it, expect } from 'vitest';
import { evaluate } from './firewall-engine.js';
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
