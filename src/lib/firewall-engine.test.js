import { describe, it, expect } from 'vitest';
import { evaluate } from './firewall-engine.js';
import { LEVELS } from '../data/levels.js';

// Niveles reales del juego (extraídos a src/data/levels.js en WP-2 / T1.1).
const level1 = LEVELS[0]; // Secure Internet Access (ALLOW + SNAT)
const level3 = LEVELS[2]; // Block Non-Standard SSH (specialCheck)
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

  it('marca NAT Mismatch si falta el SNAT', () => {
    const verdict = evaluate({ ...correctLevel1Config, nat: 'NONE' }, level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.resultMsg).toBe('NAT Mismatch');
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

describe('evaluate() — comportamiento ACTUAL con bugs conocidos (referencia para WP-3)', () => {
  // Bug #1 (CLAUDE.md): un DENY correcto hoy devuelve "Traffic Allowed".
  // Este test FIJA el comportamiento actual; T2.1 (WP-3) lo cambiará a un mensaje
  // de bloqueo y este test deberá actualizarse junto con el fix.
  it('[BUG #1] nivel 5 DENY correcto: isWin true y finalAction drop, pero msg dice "Traffic Allowed"', () => {
    const verdict = evaluate(configFrom(level5), level5);
    expect(verdict.isWin).toBe(true);
    expect(verdict.finalAction).toBe('drop');
    expect(verdict.resultMsg).toBe('Traffic Allowed'); // <- a corregir en T2.1
  });
});
