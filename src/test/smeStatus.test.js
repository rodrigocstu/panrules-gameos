import { describe, it, expect } from 'vitest';
import { smeStatusOf, SME_PENDING_IDS, SME_CORRECTED_IDS } from '../data/sme-status';
import { LEVELS } from '../data/levels';

describe('smeStatusOf', () => {
  it('marca los 4 matices (L25/L34/L38/L43) como corrected tras el sign-off SME (R-04 cerrado)', () => {
    [25, 34, 38, 43].forEach((id) => {
      expect(smeStatusOf(id)).toBe('corrected');
    });
  });

  it('marca los niveles corregidos como corrected', () => {
    [4, 10, 15, 28].forEach((id) => {
      expect(smeStatusOf(id)).toBe('corrected');
    });
  });

  it('marca el resto como verified', () => {
    expect(smeStatusOf(1)).toBe('verified');
    expect(smeStatusOf(11)).toBe('verified');
    expect(smeStatusOf(31)).toBe('verified');
  });
});

describe('SME constants', () => {
  it('no quedan matices pendientes tras el sign-off SME (R-04 cerrado)', () => {
    expect(SME_PENDING_IDS).toHaveLength(0);
  });

  it('hay 8 niveles corregidos (4 de la auditoría + 4 del sign-off SME)', () => {
    expect(SME_CORRECTED_IDS).toHaveLength(8);
  });

  it('todos los ids referenciados existen en LEVELS', () => {
    const ids = new Set(LEVELS.map((l) => l.id));
    [...SME_PENDING_IDS, ...SME_CORRECTED_IDS].forEach((id) => {
      expect(ids.has(id)).toBe(true);
    });
  });
});
