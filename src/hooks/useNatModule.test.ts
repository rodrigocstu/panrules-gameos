import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useNatModule,
  NAT_LEVELS,
  type UseNatModule,
} from './useNatModule';
import type { PolicyEditableField } from './useFirewallModule';
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

// Construye una PolicyConfig ganadora desde la solución del nivel (patrón de
// useFirewallModule.test.ts). solution.profile puede ser 'any' (irrelevante en DENY); el
// editor exige un ProfileId concreto, así que se mapea a 'none' sin alterar el acierto.
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

type HookResult = { current: UseNatModule };

function applyConfig(result: HookResult, cfg: PolicyConfig): void {
  for (const field of FIELDS) {
    act(() => result.current.setField(field, String(cfg[field])));
  }
}

describe('useNatModule (AC#3 — La Centralita, niveles SNAT/DNAT Tier F)', () => {
  it('selecciona EXACTAMENTE los 6 niveles NAT [1,2,4,7,8,10]', () => {
    expect(NAT_LEVELS).toHaveLength(6);
    expect(NAT_LEVELS.map((l) => l.id)).toEqual([1, 2, 4, 7, 8, 10]);
  });

  it('todos los niveles son Tier F y tienen solution.nat !== NONE', () => {
    expect(NAT_LEVELS.every((l) => l.tier === 'F')).toBe(true);
    expect(NAT_LEVELS.every((l) => l.solution.nat !== 'NONE')).toBe(true);
  });

  it('incluye el U-Turn (DNAT+SNAT) que El Portero excluyó (nivel 10)', () => {
    expect(NAT_LEVELS.some((l) => l.id === 10 && l.solution.nat === 'DNAT+SNAT')).toBe(true);
  });

  it('submitAnswer con la solución del primer nivel pasa a "correct"', () => {
    const { result } = renderHook(() => useNatModule());
    expect(result.current.phase).toBe('playing');
    applyConfig(result, winningConfig(NAT_LEVELS[0]));
    let verdict: Verdict | undefined;
    act(() => {
      verdict = result.current.submitAnswer();
    });
    expect(verdict?.isWin).toBe(true);
    expect(result.current.phase).toBe('correct');
  });

  it('una config errónea incrementa attemptCount y pasa a "failed"', () => {
    const { result } = renderHook(() => useNatModule());
    act(() => {
      result.current.submitAnswer();
    });
    expect(result.current.phase).toBe('failed');
    expect(result.current.attemptCount).toBe(1);
  });

  it('completar los 6 niveles de extremo a extremo lleva la fase a "complete"', () => {
    const { result } = renderHook(() => useNatModule());
    for (let i = 0; i < NAT_LEVELS.length; i++) {
      applyConfig(result, winningConfig(NAT_LEVELS[i]));
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

  it('persiste el progreso bajo una clave distinta del módulo Firewall', () => {
    const { result } = renderHook(() => useNatModule());
    applyConfig(result, winningConfig(NAT_LEVELS[0]));
    act(() => {
      result.current.submitAnswer();
    });
    expect(localStorage.getItem('egc_nat_progress')).not.toBeNull();
    expect(localStorage.getItem('egc_firewall_progress')).toBeNull();
  });
});
