import { describe, it, expect } from 'vitest';
import { resolveExplanation, REASON_GUIDANCE } from './explanations.js';
import { LEVELS } from '../data/levels.js';
import { pickText } from '../i18n/pickText.js';

const level1 = LEVELS[0]; // SNAT
const level2 = LEVELS[1]; // DNAT entrante
const level4 = LEVELS[3]; // U-Turn / hairpin

describe('resolveExplanation()', () => {
  it('devuelve la explanation del nivel (ES por defecto) cuando el acierto no tiene guía', () => {
    expect(resolveExplanation(level1, 'OK_ALLOW')).toBe(level1.explanation.es);
  });

  it('respeta el idioma solicitado (EN)', () => {
    expect(resolveExplanation(level1, 'OK_ALLOW', 'en')).toBe(level1.explanation.en);
  });

  it('devuelve la explanation del nivel cuando no llega reasonCode', () => {
    expect(resolveExplanation(level1, undefined)).toBe(level1.explanation.es);
  });

  it('devuelve la guía específica del fallo para un reasonCode conocido (por idioma)', () => {
    expect(resolveExplanation(level1, 'ZONE_MISMATCH', 'es')).toBe(
      REASON_GUIDANCE.ZONE_MISMATCH.es
    );
    expect(resolveExplanation(level1, 'NAT_MISMATCH', 'en')).toBe(REASON_GUIDANCE.NAT_MISMATCH.en);
  });

  it('cae a la explanation del nivel para un reasonCode sin guía (p. ej. SPECIAL_*)', () => {
    expect(resolveExplanation(level1, 'SPECIAL_DROPPED', 'en')).toBe(level1.explanation.en);
  });

  it('no rompe si level es null/undefined', () => {
    expect(resolveExplanation(null, 'OK_ALLOW')).toBe('');
    expect(resolveExplanation(undefined, undefined)).toBe('');
  });
});

describe('contenido pedagógico bilingüe de los niveles (T2.8 / T3.6)', () => {
  it('todos los niveles definen hint y explanation no vacíos en ES y EN', () => {
    for (const level of LEVELS) {
      for (const lang of ['es', 'en']) {
        expect(pickText(level.hint, lang).trim().length).toBeGreaterThan(0);
        expect(pickText(level.explanation, lang).trim().length).toBeGreaterThan(0);
        expect(pickText(level.title, lang).trim().length).toBeGreaterThan(0);
        expect(pickText(level.desc, lang).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('nivel 2 (DNAT entrante) enseña pre-NAT / post-NAT en ambos idiomas', () => {
    for (const lang of ['es', 'en']) {
      expect(pickText(level2.explanation, lang)).toMatch(/pre-NAT/i);
      expect(pickText(level2.explanation, lang)).toMatch(/post-NAT/i);
    }
  });

  it('nivel 4 (hairpin / U-Turn) enseña pre-NAT / post-NAT en ambos idiomas', () => {
    for (const lang of ['es', 'en']) {
      expect(pickText(level4.explanation, lang)).toMatch(/pre-NAT/i);
      expect(pickText(level4.explanation, lang)).toMatch(/post-NAT/i);
    }
  });
});
