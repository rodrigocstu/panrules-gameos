import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAvatarInterventions } from './useAvatarInterventions';
import { FIREWALL_LEVELS } from './useFirewallModule';
import { AVATAR_INTERVENTIONS } from '../lib/avatar-copy';
import { pickText } from '../i18n/pickText';

describe('useAvatarInterventions (AC#3 — 3 niveles de pista, determinista)', () => {
  it('intento 1 → línea direccional genérica (§4.2)', () => {
    const { result } = renderHook(() => useAvatarInterventions());
    act(() => result.current.onWrongAttempt(1));
    expect(result.current.currentMessage).toBe(AVATAR_INTERVENTIONS.first_wrong[0]);
    expect(result.current.isVisible).toBe(true);
  });

  it('intento 2 con APP_MISMATCH → línea de concepto App-ID (§4.2)', () => {
    const { result } = renderHook(() => useAvatarInterventions());
    act(() => result.current.onWrongAttempt(2, { reasonCode: 'APP_MISMATCH' }));
    expect(result.current.currentMessage).toBe(AVATAR_INTERVENTIONS.second_wrong.APP_MISMATCH);
  });

  it('intento ≥3 → indicación directa que incluye el hint del nivel (valor de levels.ts)', () => {
    const level = FIREWALL_LEVELS[0];
    const { result } = renderHook(() => useAvatarInterventions());
    act(() => result.current.onWrongAttempt(3, { reasonCode: 'NAT_MISMATCH' }, level));
    expect(result.current.currentMessage).toContain(pickText(level.hint, 'es'));
    expect(result.current.currentMessage).not.toContain('{hint}');
  });

  it('reasonCode sin línea de concepto degrada a la genérica (fallback documentado)', () => {
    const { result } = renderHook(() => useAvatarInterventions());
    act(() => result.current.onWrongAttempt(2, { reasonCode: 'ACTION_MISMATCH' }));
    expect(result.current.currentMessage).toBe(AVATAR_INTERVENTIONS.first_wrong[0]);
  });

  it('los tres intentos consecutivos producen mensajes distintos (R6)', () => {
    const level = FIREWALL_LEVELS[0];
    const { result } = renderHook(() => useAvatarInterventions());
    const seen = new Set<string | null>();
    act(() => result.current.onWrongAttempt(1, { reasonCode: 'ZONE_MISMATCH' }, level));
    seen.add(result.current.currentMessage);
    act(() => result.current.onWrongAttempt(2, { reasonCode: 'ZONE_MISMATCH' }, level));
    seen.add(result.current.currentMessage);
    act(() => result.current.onWrongAttempt(3, { reasonCode: 'ZONE_MISMATCH' }, level));
    seen.add(result.current.currentMessage);
    expect(seen.size).toBe(3);
  });

  it('dismiss oculta la burbuja', () => {
    const { result } = renderHook(() => useAvatarInterventions());
    act(() => result.current.onWrongAttempt(1));
    expect(result.current.isVisible).toBe(true);
    act(() => result.current.dismiss());
    expect(result.current.isVisible).toBe(false);
  });
});
