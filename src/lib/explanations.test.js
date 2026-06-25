import { describe, it, expect } from 'vitest';
import { resolveExplanation, REASON_GUIDANCE } from './explanations.js';
import { LEVELS } from '../data/levels.js';

const level1 = LEVELS[0]; // SNAT
const level2 = LEVELS[1]; // DNAT entrante
const level4 = LEVELS[3]; // U-Turn / hairpin

describe('resolveExplanation()', () => {
  it('devuelve la explanation del nivel cuando el acierto (OK_ALLOW) no tiene guía específica', () => {
    expect(resolveExplanation(level1, 'OK_ALLOW')).toBe(level1.explanation);
  });

  it('devuelve la explanation del nivel cuando no llega reasonCode', () => {
    expect(resolveExplanation(level1, undefined)).toBe(level1.explanation);
  });

  it('devuelve la guía específica del fallo para un reasonCode conocido', () => {
    expect(resolveExplanation(level1, 'ZONE_MISMATCH')).toBe(REASON_GUIDANCE.ZONE_MISMATCH);
    expect(resolveExplanation(level1, 'NAT_MISMATCH')).toBe(REASON_GUIDANCE.NAT_MISMATCH);
  });

  it('cae a la explanation del nivel para un reasonCode sin guía (p. ej. SPECIAL_*)', () => {
    expect(resolveExplanation(level1, 'SPECIAL_DROPPED')).toBe(level1.explanation);
  });

  it('no rompe si level es null/undefined', () => {
    expect(resolveExplanation(null, 'OK_ALLOW')).toBe('');
    expect(resolveExplanation(undefined, undefined)).toBe('');
  });
});

describe('contenido pedagógico de los niveles (T2.8)', () => {
  it('todos los niveles definen hint y explanation no vacíos', () => {
    for (const level of LEVELS) {
      expect(typeof level.hint).toBe('string');
      expect(level.hint.trim().length).toBeGreaterThan(0);
      expect(typeof level.explanation).toBe('string');
      expect(level.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  it('nivel 2 (DNAT entrante) enseña explícitamente pre-NAT / post-NAT', () => {
    expect(level2.explanation).toMatch(/pre-NAT/i);
    expect(level2.explanation).toMatch(/post-NAT/i);
  });

  it('nivel 4 (hairpin / U-Turn) enseña explícitamente pre-NAT / post-NAT', () => {
    expect(level4.explanation).toMatch(/pre-NAT/i);
    expect(level4.explanation).toMatch(/post-NAT/i);
  });
});
