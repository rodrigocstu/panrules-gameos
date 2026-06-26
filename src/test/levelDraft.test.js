import { describe, it, expect } from 'vitest';
import { EMPTY_DRAFT, buildLevel, validateDraft } from '../lib/levelDraft.js';

// Borrador completo y consistente (la solución coincide con el paquete).
function fullDraft(overrides = {}) {
  return {
    ...EMPTY_DRAFT,
    titleEs: 'Título',
    titleEn: 'Title',
    descEs: 'Desc',
    descEn: 'Desc',
    hintEs: 'Pista',
    hintEn: 'Hint',
    explEs: 'Explicación',
    explEn: 'Explanation',
    ...overrides,
  };
}

describe('buildLevel', () => {
  it('produce un objeto Level con id numérico', () => {
    const level = buildLevel(fullDraft({ id: 50 }));
    expect(level.id).toBe(50);
    expect(typeof level.id).toBe('number');
  });

  it('mapea los textos a objetos {es, en}', () => {
    const level = buildLevel(fullDraft());
    expect(level.title).toEqual({ es: 'Título', en: 'Title' });
    expect(level.hint).toEqual({ es: 'Pista', en: 'Hint' });
  });

  it('packet y solution comparten zonas', () => {
    const level = buildLevel(fullDraft({ srcZone: 'dmz', dstZone: 'untrust' }));
    expect(level.packet.srcZone).toBe('dmz');
    expect(level.solution.dstZone).toBe('untrust');
  });

  it('construye el bloque NAT con traducción para SNAT', () => {
    const level = buildLevel(fullDraft({ solNat: 'SNAT', srcIp: '10.0.0.1' }));
    expect(level.nat.type).toBe('SNAT');
    expect(level.nat.source.translated).toBe('203.0.113.1');
  });

  it('NAT NONE no traduce (identidad)', () => {
    const level = buildLevel(fullDraft({ solNat: 'NONE', srcIp: '10.0.0.1', dstIp: '10.0.0.2' }));
    expect(level.nat.source.translated).toBe('10.0.0.1');
    expect(level.nat.destination.translated).toBe('10.0.0.2');
  });
});

describe('validateDraft — campos requeridos', () => {
  it('marca title faltante', () => {
    const res = validateDraft(fullDraft({ titleEs: '', titleEn: '' }));
    expect(res.fieldErrors).toContain('title');
    expect(res.valid).toBe(false);
  });

  it('marca explanation faltante', () => {
    const res = validateDraft(fullDraft({ explEs: '', explEn: '' }));
    expect(res.fieldErrors).toContain('explanation');
  });

  it('marca id inválido (<= 0)', () => {
    const res = validateDraft(fullDraft({ id: 0 }));
    expect(res.fieldErrors).toContain('id');
  });

  it('marca tracks vacío', () => {
    const res = validateDraft(fullDraft({ tracks: [] }));
    expect(res.fieldErrors).toContain('tracks');
  });
});

describe('validateDraft — consistencia con el motor', () => {
  it('un borrador completo y coherente es válido (la solución gana)', () => {
    const res = validateDraft(fullDraft());
    expect(res.fieldErrors).toEqual([]);
    expect(res.verdict.isWin).toBe(true);
    expect(res.valid).toBe(true);
  });

  it('una solución DENY también produce un nivel válido', () => {
    const res = validateDraft(
      fullDraft({ solAction: 'DENY', solNat: 'NONE', solProfile: 'none' })
    );
    expect(res.verdict.isWin).toBe(true);
    expect(res.valid).toBe(true);
  });

  it('devuelve el level construido junto al veredicto', () => {
    const res = validateDraft(fullDraft({ id: 99 }));
    expect(res.level.id).toBe(99);
  });
});
