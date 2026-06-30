import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakDashboard, CalendarStrip } from './StreakDashboard';
import type { StreakDay } from '../../types/domain';

beforeEach(() => localStorage.clear());

describe('StreakDashboard (EGC-12)', () => {
  it('muestra racha actual, récord y tokens de Freeze (hidratados de localStorage)', async () => {
    localStorage.setItem(
      'egc_streak',
      JSON.stringify({
        userId: 'u1',
        currentStreak: 5,
        longestStreak: 8,
        lastCheckinAt: new Date().toISOString(),
        totalDaysActive: 12,
        startedAt: new Date().toISOString(),
        freezeTokens: 2,
      })
    );
    render(<StreakDashboard />);
    await screen.findByText('2 Freeze'); // espera la hidratación async
    expect(screen.getByLabelText(/Racha: 5 d/)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument(); // récord
  });

  it('oculta el calendario y lo indica cuando no hay historial (offline)', async () => {
    localStorage.setItem(
      'egc_streak',
      JSON.stringify({
        userId: 'u1',
        currentStreak: 1,
        longestStreak: 1,
        lastCheckinAt: new Date().toISOString(),
        totalDaysActive: 1,
        startedAt: new Date().toISOString(),
        freezeTokens: 0,
      })
    );
    render(<StreakDashboard />);
    await screen.findByText(/El calendario de actividad aparece cuando hay conexión/);
    expect(screen.queryByTestId('streak-calendar')).toBeNull();
  });
});

describe('CalendarStrip (calendario de 14 días)', () => {
  it('renderiza los puntos con sus estados: lleno / hielo / vacío', () => {
    const days: StreakDay[] = [
      { date: '2026-06-29', active: true, levelsCompleted: 1 }, // completado
      { date: '2026-06-28', active: true, levelsCompleted: 0, isFreeze: true }, // freeze
      { date: '2026-06-27', active: false, levelsCompleted: 0 }, // ausente
    ];
    render(<CalendarStrip days={days} />);
    const strip = screen.getByTestId('streak-calendar');
    expect(strip).toHaveAttribute('role', 'img');
    expect(strip.getAttribute('aria-label')).toContain('1 completados');
    expect(strip.getAttribute('aria-label')).toContain('1 protegidos con Freeze');

    const dots = strip.querySelectorAll('span[data-state]');
    expect(dots).toHaveLength(3);
    const states = Array.from(dots).map((d) => d.getAttribute('data-state'));
    expect(states).toContain('completed');
    expect(states).toContain('freeze');
    expect(states).toContain('absent');
  });
});
