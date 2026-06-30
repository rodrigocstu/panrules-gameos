import { describe, it, expect } from 'vitest';
import {
  freezeStreak,
  earnFreeze,
  canFreeze,
  isStreakBroken,
  MAX_FREEZE_TOKENS,
} from './streak-freeze';
import type { Streak } from '../types/domain';

// Fixture: una racha con overrides. lastCheckinAt por defecto "hace 3 días" (racha rota).
function mkStreak(overrides: Partial<Streak> = {}): Streak {
  const threeDaysAgo = new Date('2026-06-26T08:00:00');
  return {
    userId: 'u1',
    currentStreak: 5,
    longestStreak: 8,
    lastCheckinAt: threeDaysAgo.toISOString(),
    totalDaysActive: 10,
    startedAt: new Date('2026-06-01T08:00:00').toISOString(),
    freezeTokens: 1,
    ...overrides,
  };
}

const NOW = new Date('2026-06-29T10:00:00'); // 3 días después del check-in por defecto

describe('streak-freeze (EGC-12, AC#3 — reductores puros)', () => {
  it('isStreakBroken: true cuando se perdió ≥1 día y no hay check-in hoy', () => {
    expect(isStreakBroken(mkStreak(), NOW)).toBe(true);
  });

  it('isStreakBroken: false si ya hay check-in hoy', () => {
    expect(isStreakBroken(mkStreak({ lastCheckinAt: NOW.toISOString() }), NOW)).toBe(false);
  });

  it('isStreakBroken: false si el hueco es de solo 1 día (racha aún viva)', () => {
    const yesterday = new Date('2026-06-28T08:00:00').toISOString();
    expect(isStreakBroken(mkStreak({ lastCheckinAt: yesterday }), NOW)).toBe(false);
  });

  it('canFreeze: true con racha rota y tokens; false con 0 tokens', () => {
    expect(canFreeze(mkStreak({ freezeTokens: 2 }), NOW)).toBe(true);
    expect(canFreeze(mkStreak({ freezeTokens: 0 }), NOW)).toBe(false);
  });

  it('canFreeze: false si ya hizo check-in hoy aunque tenga tokens', () => {
    expect(canFreeze(mkStreak({ freezeTokens: 3, lastCheckinAt: NOW.toISOString() }), NOW)).toBe(
      false
    );
  });

  it('freezeStreak: decrementa freezeTokens y PRESERVA currentStreak', () => {
    const before = mkStreak({ freezeTokens: 2, currentStreak: 5 });
    const after = freezeStreak(before, NOW);
    expect(after.freezeTokens).toBe(1);
    expect(after.currentStreak).toBe(5); // preservado: es lo que el freeze protege
    expect(after.totalDaysActive).toBe(before.totalDaysActive + 1);
  });

  it('freezeStreak: puentea lastCheckinAt a hoy (el próximo check-in será consecutivo)', () => {
    const after = freezeStreak(mkStreak({ freezeTokens: 1 }), NOW);
    expect(after.lastCheckinAt).toBe(NOW.toISOString());
    // tras congelar, ya no procede otro freeze el mismo día (no doble-gasto)
    expect(canFreeze(after, NOW)).toBe(false);
  });

  it('freezeStreak: con 0 tokens es no-op (devuelve la misma referencia)', () => {
    const before = mkStreak({ freezeTokens: 0 });
    expect(freezeStreak(before, NOW)).toBe(before);
  });

  it('freezeStreak: sin racha rota es no-op (devuelve la misma referencia)', () => {
    const notBroken = mkStreak({ freezeTokens: 2, lastCheckinAt: NOW.toISOString() });
    expect(freezeStreak(notBroken, NOW)).toBe(notBroken);
  });

  it('earnFreeze: incrementa con tope MAX_FREEZE_TOKENS=3', () => {
    expect(earnFreeze(mkStreak({ freezeTokens: 0 })).freezeTokens).toBe(1);
    expect(earnFreeze(mkStreak({ freezeTokens: MAX_FREEZE_TOKENS })).freezeTokens).toBe(
      MAX_FREEZE_TOKENS
    );
    expect(MAX_FREEZE_TOKENS).toBe(3);
  });
});
