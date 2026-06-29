import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useStreak,
  makeInitialStreak,
  nextStreakOnCheckin,
  isCheckedInToday,
} from './useStreak';

beforeEach(() => localStorage.clear());

describe('helpers de racha (puros)', () => {
  it('makeInitialStreak arranca en currentStreak=1', () => {
    const s = makeInitialStreak('u1', new Date('2026-06-29T10:00:00'));
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(1);
    expect(s.totalDaysActive).toBe(1);
    expect(s.userId).toBe('u1');
  });

  it('nextStreakOnCheckin: mismo día es no-op (misma referencia)', () => {
    const base = makeInitialStreak('u1', new Date('2026-06-29T08:00:00'));
    const same = nextStreakOnCheckin(base, new Date('2026-06-29T20:00:00'));
    expect(same).toBe(base);
    expect(same.currentStreak).toBe(1);
  });

  it('nextStreakOnCheckin: día siguiente consecutivo incrementa', () => {
    const base = makeInitialStreak('u1', new Date('2026-06-29T08:00:00'));
    const next = nextStreakOnCheckin(base, new Date('2026-06-30T08:00:00'));
    expect(next.currentStreak).toBe(2);
    expect(next.longestStreak).toBe(2);
    expect(next.totalDaysActive).toBe(2);
  });

  it('nextStreakOnCheckin: hueco > 1 día reinicia a 1 pero conserva el récord', () => {
    const base = {
      ...makeInitialStreak('u1', new Date('2026-06-29T08:00:00')),
      currentStreak: 5,
      longestStreak: 5,
    };
    const next = nextStreakOnCheckin(base, new Date('2026-07-05T08:00:00'));
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(5);
  });

  it('isCheckedInToday refleja el día local', () => {
    expect(isCheckedInToday(makeInitialStreak('u1', new Date()))).toBe(true);
    expect(isCheckedInToday(null)).toBe(false);
  });
});

describe('useStreak (AC#3)', () => {
  it('initStreak fija currentStreak=1 y persiste en localStorage', async () => {
    const { result } = renderHook(() => useStreak());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.initStreak('user-1');
    });
    expect(result.current.streak?.currentStreak).toBe(1);
    const raw = localStorage.getItem('egc_streak');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).currentStreak).toBe(1);
  });

  it('hidrata desde localStorage sin red (StreakCounter correcto al recargar offline)', async () => {
    localStorage.setItem('egc_streak', JSON.stringify(makeInitialStreak('user-1', new Date())));
    const { result } = renderHook(() => useStreak());
    await waitFor(() => expect(result.current.streak).not.toBeNull());
    expect(result.current.streak?.currentStreak).toBe(1);
    expect(result.current.todayCheckedIn).toBe(true);
  });
});
