import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  usePolicyModule,
  POLICY_LEVELS,
  makeSeedRules,
  type UsePolicyModule,
} from './usePolicyModule';
import { detectShadowing, evaluateOrdered } from '../lib/firewall-engine';
import type { OrderedVerdict } from '../types/domain';

beforeEach(() => localStorage.clear());

type HookResult = { current: UsePolicyModule };

/** Índice de la regla solución (`rule-solution`) en la lista actual del hook. */
function solutionIndex(result: HookResult): number {
  return result.current.rules.findIndex((r) => r.id === 'rule-solution');
}

describe('POLICY_LEVELS (AC#1 — reusa los 9 niveles Tier F)', () => {
  it('selecciona EXACTAMENTE los 9 niveles ids 1–9', () => {
    expect(POLICY_LEVELS).toHaveLength(9);
    expect(POLICY_LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('todos los niveles son Tier F', () => {
    expect(POLICY_LEVELS.every((l) => l.tier === 'F')).toBe(true);
  });
});

describe('makeSeedRules (seed derivado en runtime — diseño de orden/shadowing)', () => {
  it('precondición del seed: solution.{src,dst}Zone === packet.{src,dst}Zone en los 9 niveles', () => {
    // Garantiza que la regla derivada de la solución pase el filtro de zonas de evaluateOrdered.
    for (const level of POLICY_LEVELS) {
      expect(level.solution.srcZone).toBe(level.packet.srcZone);
      expect(level.solution.dstZone).toBe(level.packet.dstZone);
    }
  });

  it('produce 2 reglas: una ancha (any) sobre una derivada de la solución', () => {
    for (const level of POLICY_LEVELS) {
      const seed = makeSeedRules(level);
      expect(seed).toHaveLength(2);
      const [broad, solution] = seed;
      expect(broad.id).toBe('rule-broad');
      expect(broad.srcZone).toBe('any');
      expect(broad.dstZone).toBe('any');
      expect(broad.app).toBe('any');
      // La regla ancha lleva la action OPUESTA a la solución.
      expect(broad.action).not.toBe(level.solution.action);
      expect(solution.id).toBe('rule-solution');
      expect(solution.srcZone).toBe(level.solution.srcZone);
      expect(solution.action).toBe(level.solution.action);
    }
  });

  it('el seed tiene shadowing vivo desde el inicio en los 9 niveles', () => {
    for (const level of POLICY_LEVELS) {
      const reports = detectShadowing(makeSeedRules(level));
      expect(reports.length).toBeGreaterThan(0);
      // La regla ancha sombrea a la solución (nunca al revés).
      expect(reports.some((r) => r.shadowedRuleId === 'rule-solution')).toBe(true);
    }
  });

  it('evaluado tal cual (regla ancha primero) NINGÚN nivel gana; movida la solución arriba, TODOS ganan', () => {
    for (const level of POLICY_LEVELS) {
      const seed = makeSeedRules(level);
      // Regla ancha primero → la solución está sombreada → no se gana.
      expect(evaluateOrdered(seed, level).isWin).toBe(false);
      // Solución arriba (orden invertido) → se gana.
      const reordered = [seed[1], seed[0]];
      expect(evaluateOrdered(reordered, level).isWin).toBe(true);
      // Deshabilitar la ancha (sin reordenar) también gana.
      const disabledBroad = [{ ...seed[0], disabled: true }, seed[1]];
      expect(evaluateOrdered(disabledBroad, level).isWin).toBe(true);
    }
  });
});

describe('usePolicyModule (AC#2 — orden, shadowing y progresión por verdict)', () => {
  it('arranca en "playing" con el seed sombreado del primer nivel', () => {
    const { result } = renderHook(() => usePolicyModule());
    expect(result.current.phase).toBe('playing');
    expect(result.current.rules.map((r) => r.id)).toEqual(['rule-broad', 'rule-solution']);
    expect(result.current.shadowReports.length).toBeGreaterThan(0);
  });

  it('submitAnswer sobre el seed (sombreado) → isWin false y phase "failed"', () => {
    const { result } = renderHook(() => usePolicyModule());
    let verdict: OrderedVerdict | undefined;
    act(() => {
      verdict = result.current.submitAnswer();
    });
    expect(verdict?.isWin).toBe(false);
    expect(result.current.phase).toBe('failed');
    expect(result.current.attemptCount).toBe(1);
  });

  it('moveRuleUp de la solución limpia el shadowing y gana (phase "correct" + persiste)', () => {
    const { result } = renderHook(() => usePolicyModule());
    const level = result.current.level;
    act(() => result.current.moveRuleUp(solutionIndex(result)));
    // La solución específica ya no es sombreada por nadie: el banner se limpia en vivo.
    expect(result.current.shadowReports).toHaveLength(0);
    expect(result.current.rules[0].id).toBe('rule-solution');
    let verdict: OrderedVerdict | undefined;
    act(() => {
      verdict = result.current.submitAnswer();
    });
    expect(verdict?.isWin).toBe(true);
    expect(result.current.phase).toBe('correct');
    expect(result.current.completedIds).toContain(level.id);
    expect(localStorage.getItem('egc_policy_progress')).not.toBeNull();
  });

  it('toggleRuleDisabled de la regla ancha también desbloquea la victoria', () => {
    const { result } = renderHook(() => usePolicyModule());
    const broadIdx = result.current.rules.findIndex((r) => r.id === 'rule-broad');
    act(() => result.current.toggleRuleDisabled(broadIdx));
    expect(result.current.shadowReports).toHaveLength(0);
    let verdict: OrderedVerdict | undefined;
    act(() => {
      verdict = result.current.submitAnswer();
    });
    expect(verdict?.isWin).toBe(true);
    expect(result.current.phase).toBe('correct');
  });

  it('un nivel con solución DENY gana por isWin aunque finalAction sea "drop" (invariante #1)', () => {
    const { result } = renderHook(() => usePolicyModule());
    // El nivel 5 (índice 4) tiene solución DENY: avanza hasta él.
    const denyIndex = POLICY_LEVELS.findIndex((l) => l.solution.action === 'DENY');
    expect(denyIndex).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < denyIndex; i++) {
      act(() => result.current.moveRuleUp(solutionIndex(result)));
      act(() => result.current.submitAnswer());
      act(() => result.current.nextLevel());
    }
    expect(result.current.level.solution.action).toBe('DENY');
    act(() => result.current.moveRuleUp(solutionIndex(result)));
    let verdict: OrderedVerdict | undefined;
    act(() => {
      verdict = result.current.submitAnswer();
    });
    expect(verdict?.isWin).toBe(true);
    expect(verdict?.finalAction).toBe('drop');
    expect(result.current.phase).toBe('correct');
  });

  it('setRuleField actualiza un campo de la regla indicada (swap inmutable)', () => {
    const { result } = renderHook(() => usePolicyModule());
    act(() => result.current.setRuleField(0, 'action', 'ALLOW'));
    expect(result.current.rules[0].action).toBe('ALLOW');
    expect(result.current.rules[0].id).toBe('rule-broad');
  });

  it('completar los 9 niveles de extremo a extremo lleva la fase a "complete"', () => {
    const { result } = renderHook(() => usePolicyModule());
    for (let i = 0; i < POLICY_LEVELS.length; i++) {
      act(() => result.current.moveRuleUp(solutionIndex(result)));
      act(() => result.current.submitAnswer());
      expect(result.current.phase).toBe('correct');
      act(() => result.current.nextLevel());
    }
    expect(result.current.phase).toBe('complete');
  });

  it('nextLevel re-deriva el seed (vuelve a haber shadowing en el nivel nuevo)', () => {
    const { result } = renderHook(() => usePolicyModule());
    act(() => result.current.moveRuleUp(solutionIndex(result)));
    act(() => result.current.submitAnswer());
    act(() => result.current.nextLevel());
    expect(result.current.phase).toBe('playing');
    expect(result.current.rules.map((r) => r.id)).toEqual(['rule-broad', 'rule-solution']);
    expect(result.current.shadowReports.length).toBeGreaterThan(0);
  });

  it('resetModule limpia el storage y vuelve al primer nivel', () => {
    const { result } = renderHook(() => usePolicyModule());
    act(() => result.current.moveRuleUp(solutionIndex(result)));
    act(() => result.current.submitAnswer());
    expect(localStorage.getItem('egc_policy_progress')).not.toBeNull();
    act(() => result.current.resetModule());
    expect(localStorage.getItem('egc_policy_progress')).toBeNull();
    expect(result.current.currentLevelIndex).toBe(0);
    expect(result.current.completedIds).toHaveLength(0);
    expect(result.current.phase).toBe('playing');
  });

  it('persiste bajo una clave distinta de los módulos Firewall y NAT', () => {
    const { result } = renderHook(() => usePolicyModule());
    act(() => result.current.moveRuleUp(solutionIndex(result)));
    act(() => result.current.submitAnswer());
    expect(localStorage.getItem('egc_policy_progress')).not.toBeNull();
    expect(localStorage.getItem('egc_firewall_progress')).toBeNull();
    expect(localStorage.getItem('egc_nat_progress')).toBeNull();
  });
});
