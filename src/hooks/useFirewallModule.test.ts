import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useFirewallModule,
  FIREWALL_LEVELS,
  type PolicyEditableField,
  type UseFirewallModule,
} from './useFirewallModule';
import type { Level, PolicyConfig, Verdict } from '../types/domain';

beforeEach(() => localStorage.clear());

const FIELDS: PolicyEditableField[] = [
  'srcZone',
  'dstZone',
  'app',
  'service',
  'action',
  'nat',
  'profile',
];

// Construye una PolicyConfig ganadora desde la solución del nivel. solution.profile puede
// ser 'any' (irrelevante en reglas DENY); el editor exige un ProfileId concreto, así que
// se mapea a 'none' sin alterar el acierto.
function winningConfig(level: Level): PolicyConfig {
  const s = level.solution;
  return {
    srcZone: s.srcZone,
    dstZone: s.dstZone,
    app: s.app,
    service: s.service,
    action: s.action,
    nat: s.nat,
    profile: s.profile === 'any' ? 'none' : s.profile,
  };
}

type HookResult = { current: UseFirewallModule };

function applyConfig(result: HookResult, cfg: PolicyConfig): void {
  for (const field of FIELDS) {
    act(() => result.current.setField(field, String(cfg[field])));
  }
}

describe('useFirewallModule (AC#2 — recorrer L1–L9)', () => {
  it('selecciona exactamente los 9 niveles L1–L9 (tier F)', () => {
    expect(FIREWALL_LEVELS).toHaveLength(9);
    expect(FIREWALL_LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(FIREWALL_LEVELS.every((l) => l.tier === 'F')).toBe(true);
  });

  it('submitAnswer con la solución de L1 como config pasa a "correct"', () => {
    const { result } = renderHook(() => useFirewallModule());
    expect(result.current.phase).toBe('playing');
    applyConfig(result, winningConfig(FIREWALL_LEVELS[0]));
    let verdict: Verdict | undefined;
    act(() => {
      verdict = result.current.submitAnswer();
    });
    expect(verdict?.isWin).toBe(true);
    expect(result.current.phase).toBe('correct');
  });

  it('una config errónea incrementa attemptCount y pasa a "failed"', () => {
    const { result } = renderHook(() => useFirewallModule());
    act(() => {
      result.current.submitAnswer();
    });
    expect(result.current.phase).toBe('failed');
    expect(result.current.attemptCount).toBe(1);
  });

  it('nextLevel avanza el índice y resetea intento y fase', () => {
    const { result } = renderHook(() => useFirewallModule());
    applyConfig(result, winningConfig(FIREWALL_LEVELS[0]));
    act(() => {
      result.current.submitAnswer();
    });
    act(() => {
      result.current.nextLevel();
    });
    expect(result.current.currentLevelIndex).toBe(1);
    expect(result.current.phase).toBe('playing');
    expect(result.current.attemptCount).toBe(0);
  });

  it('completar los 9 niveles consecutivos lleva la fase a "complete"', () => {
    const { result } = renderHook(() => useFirewallModule());
    for (let i = 0; i < FIREWALL_LEVELS.length; i++) {
      applyConfig(result, winningConfig(FIREWALL_LEVELS[i]));
      act(() => {
        result.current.submitAnswer();
      });
      expect(result.current.phase).toBe('correct');
      act(() => {
        result.current.nextLevel();
      });
    }
    expect(result.current.phase).toBe('complete');
  });
});
