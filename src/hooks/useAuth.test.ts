import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, makeOfflineUser } from './useAuth';

beforeEach(() => localStorage.clear());

describe('useAuth (modo offline — VITE_API_URL vacío)', () => {
  it('makeOfflineUser arranca sin calibración', () => {
    const u = makeOfflineUser('a@b.com');
    expect(u.email).toBe('a@b.com');
    expect(u.calibrationDone).toBe(false);
    expect(u.learningPath).toBe('beginner');
  });

  it('register almacena el usuario en localStorage y autentica', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.register('a@b.com', 'password123');
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('a@b.com');
    expect(result.current.user?.calibrationDone).toBe(false);
    expect(localStorage.getItem('egc_auth_user')).not.toBeNull();
  });

  it('logout limpia la sesión y el almacenamiento', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.register('a@b.com', 'password123');
    });
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('egc_auth_user')).toBeNull();
  });

  it('completeCalibration marca calibrationDone y fija el learning path', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.register('a@b.com', 'password123');
    });
    act(() => {
      result.current.completeCalibration('intermediate');
    });
    await waitFor(() => expect(result.current.user?.calibrationDone).toBe(true));
    expect(result.current.user?.learningPath).toBe('intermediate');
  });

  it('hidrata la sesión persistida al montar (loading resuelve a false)', async () => {
    localStorage.setItem('egc_auth_user', JSON.stringify(makeOfflineUser('persist@b.com')));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('persist@b.com');
  });
});
