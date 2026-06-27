import { describe, it, expect } from 'vitest';
import { diffConfig, buildTutorAdvice } from '../lib/tutor.js';

const solution = {
  srcZone: 'trust',
  dstZone: 'untrust',
  app: 'ssl',
  service: 'application-default',
  action: 'ALLOW',
  nat: 'SNAT',
  profile: 'default',
};

const correctConfig = { ...solution, profile: 'default' };

describe('diffConfig — sin diferencias', () => {
  it('devuelve [] cuando la config coincide con la solución', () => {
    expect(diffConfig(correctConfig, solution)).toEqual([]);
  });

  it('tolera config o solución nulas', () => {
    expect(diffConfig(null, solution)).toEqual([]);
    expect(diffConfig(correctConfig, null)).toEqual([]);
  });
});

describe('diffConfig — campos simples', () => {
  it('detecta zona destino incorrecta', () => {
    const diffs = diffConfig({ ...correctConfig, dstZone: 'dmz' }, solution);
    expect(diffs).toContainEqual({ field: 'dstZone', your: 'dmz', correct: 'untrust' });
  });

  it('detecta App-ID incorrecto', () => {
    const diffs = diffConfig({ ...correctConfig, app: 'any' }, solution);
    expect(diffs).toContainEqual({ field: 'app', your: 'any', correct: 'ssl' });
  });

  it('detecta NAT incorrecto', () => {
    const diffs = diffConfig({ ...correctConfig, nat: 'NONE' }, solution);
    expect(diffs.find((d) => d.field === 'nat').correct).toBe('SNAT');
  });

  it('acumula múltiples diferencias', () => {
    const diffs = diffConfig({ ...correctConfig, app: 'any', action: 'DENY' }, solution);
    expect(diffs).toHaveLength(2);
  });
});

describe('diffConfig — perfil con semántica de rango', () => {
  it('marca perfil insuficiente (none < default)', () => {
    const diffs = diffConfig({ ...correctConfig, profile: 'none' }, solution);
    expect(diffs.find((d) => d.field === 'profile')).toBeTruthy();
  });

  it('no marca perfil de mayor rango como error', () => {
    const diffs = diffConfig({ ...correctConfig, profile: 'strict' }, solution);
    expect(diffs.find((d) => d.field === 'profile')).toBeFalsy();
  });

  it('no evalúa el perfil si la solución pide "any"', () => {
    const diffs = diffConfig({ ...correctConfig, profile: 'none' }, { ...solution, profile: 'any' });
    expect(diffs.find((d) => d.field === 'profile')).toBeFalsy();
  });
});

describe('buildTutorAdvice', () => {
  it('correct=true cuando no hay diferencias', () => {
    const advice = buildTutorAdvice({ solution }, correctConfig);
    expect(advice.correct).toBe(true);
    expect(advice.diffs).toEqual([]);
  });

  it('correct=false con diferencias', () => {
    const advice = buildTutorAdvice({ solution }, { ...correctConfig, app: 'any' });
    expect(advice.correct).toBe(false);
    expect(advice.diffs.length).toBeGreaterThan(0);
  });
});
