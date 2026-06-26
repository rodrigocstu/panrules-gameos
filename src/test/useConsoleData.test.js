import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  readProgress,
  difficultyOf,
  buildConsoleData,
  useConsoleData,
} from '../hooks/useConsoleData.js';
import { LEVELS } from '../data/levels';

const PROGRESS_KEY = 'panrules-gameos:progress:v2';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  localStorage.clear();
});

function seed(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

describe('readProgress', () => {
  it('devuelve estructura vacía sin localStorage', () => {
    const p = readProgress();
    expect(p.completed).toEqual([]);
    expect(p.attempts).toEqual({});
    expect(p.score).toBe(0);
  });

  it('lee progreso válido', () => {
    seed({ completed: [1, 2], attempts: { 1: 1, 2: 3 }, score: 180, bestStreak: 2 });
    const p = readProgress();
    expect(p.completed).toEqual([1, 2]);
    expect(p.attempts[2]).toBe(3);
    expect(p.score).toBe(180);
    expect(p.bestStreak).toBe(2);
  });

  it('tolera JSON corrupto', () => {
    localStorage.setItem(PROGRESS_KEY, '{bad json');
    const p = readProgress();
    expect(p.completed).toEqual([]);
  });

  it('tolera esquema parcial', () => {
    seed({ foo: 'bar' });
    const p = readProgress();
    expect(p.completed).toEqual([]);
    expect(p.attempts).toEqual({});
  });
});

describe('difficultyOf', () => {
  const level = { id: 5 };

  it('untried cuando no hay intentos ni completado', () => {
    expect(difficultyOf(level, new Set(), {})).toBe('untried');
  });

  it('attempted cuando hay intentos pero no completado', () => {
    expect(difficultyOf(level, new Set(), { 5: 2 })).toBe('attempted');
  });

  it('easy cuando completado en 1 intento', () => {
    expect(difficultyOf(level, new Set([5]), { 5: 1 })).toBe('easy');
  });

  it('medium cuando completado en 2-3 intentos', () => {
    expect(difficultyOf(level, new Set([5]), { 5: 3 })).toBe('medium');
  });

  it('hard cuando completado en 4+ intentos', () => {
    expect(difficultyOf(level, new Set([5]), { 5: 5 })).toBe('hard');
  });
});

describe('buildConsoleData', () => {
  it('produce una entrada por cada nivel', () => {
    const { perLevel } = buildConsoleData();
    expect(perLevel).toHaveLength(LEVELS.length);
  });

  it('totals.levels coincide con LEVELS.length', () => {
    const { totals } = buildConsoleData();
    expect(totals.levels).toBe(LEVELS.length);
  });

  it('cuenta los completados correctamente', () => {
    seed({ completed: [1, 2, 3], attempts: { 1: 1, 2: 1, 3: 2 }, score: 0, bestStreak: 0 });
    const { totals } = buildConsoleData();
    expect(totals.completed).toBe(3);
  });

  it('suma totalAttempts de todos los niveles', () => {
    seed({ completed: [1], attempts: { 1: 2, 2: 3 }, score: 0, bestStreak: 0 });
    const { totals } = buildConsoleData();
    expect(totals.totalAttempts).toBe(5);
  });

  it('hasData es false sin progreso', () => {
    const { totals } = buildConsoleData();
    expect(totals.hasData).toBe(false);
  });

  it('hasData es true con progreso', () => {
    seed({ completed: [1], attempts: { 1: 1 }, score: 100, bestStreak: 1 });
    const { totals } = buildConsoleData();
    expect(totals.hasData).toBe(true);
  });

  it('el desglose por tier suma el total de niveles', () => {
    const { totals } = buildConsoleData();
    expect(totals.tierF + totals.tierN + totals.tierA).toBe(LEVELS.length);
  });

  it('asigna dificultad easy a un nivel completado en 1 intento', () => {
    seed({ completed: [1], attempts: { 1: 1 }, score: 100, bestStreak: 1 });
    const { perLevel } = buildConsoleData();
    const lvl1 = perLevel.find((l) => l.id === 1);
    expect(lvl1.difficulty).toBe('easy');
    expect(lvl1.completed).toBe(true);
  });
});

describe('useConsoleData', () => {
  it('devuelve perLevel y totals', () => {
    const { result } = renderHook(() => useConsoleData());
    expect(result.current.perLevel).toHaveLength(LEVELS.length);
    expect(result.current.totals.levels).toBe(LEVELS.length);
  });
});
