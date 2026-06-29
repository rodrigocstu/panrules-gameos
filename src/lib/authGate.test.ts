import { describe, it, expect } from 'vitest';
import { resolveGate } from './authGate';
import { parseRoute, isProtectedRoute, isAuthRoute, isOnboarding } from '../hooks/useHashRoute.js';

describe('resolveGate (AC#4 — gate de la raíz)', () => {
  it('mientras carga muestra splash (nunca contenido protegido)', () => {
    expect(
      resolveGate({ loading: true, isAuthenticated: false, calibrationDone: false, route: 'home' })
    ).toBe('splash');
  });

  it('sin sesión, cualquier ruta protegida resuelve a onboarding (no app)', () => {
    for (const route of ['home', 'calibration', 'profile']) {
      const decision = resolveGate({
        loading: false,
        isAuthenticated: false,
        calibrationDone: false,
        route,
      });
      expect(decision).toBe('onboarding');
      expect(decision).not.toBe('app');
    }
  });

  it('autenticado pero sin calibrar → sigue en onboarding', () => {
    expect(
      resolveGate({ loading: false, isAuthenticated: true, calibrationDone: false, route: 'home' })
    ).toBe('onboarding');
  });

  it('autenticado y calibrado → app', () => {
    expect(
      resolveGate({ loading: false, isAuthenticated: true, calibrationDone: true, route: 'home' })
    ).toBe('app');
  });
});

describe('clasificación de rutas (useHashRoute EGC-10)', () => {
  it('reconoce las nuevas rutas y preserva las legacy', () => {
    expect(parseRoute('#/auth')).toBe('auth');
    expect(parseRoute('#/calibration')).toBe('calibration');
    expect(parseRoute('#/home')).toBe('home');
    expect(parseRoute('#/profile')).toBe('profile');
    expect(parseRoute('#/console')).toBe('console');
    expect(parseRoute('#/warroom')).toBe('warroom');
    expect(parseRoute('#/loquesea')).toBe('game');
  });

  it('isProtectedRoute marca home/profile/calibration', () => {
    expect(isProtectedRoute('home')).toBe(true);
    expect(isProtectedRoute('profile')).toBe(true);
    expect(isProtectedRoute('calibration')).toBe(true);
    expect(isProtectedRoute('auth')).toBe(false);
    expect(isProtectedRoute('game')).toBe(false);
  });

  it('isAuthRoute / isOnboarding', () => {
    expect(isAuthRoute('auth')).toBe(true);
    expect(isAuthRoute('home')).toBe(false);
    expect(isOnboarding('auth')).toBe(true);
    expect(isOnboarding('calibration')).toBe(true);
    expect(isOnboarding('home')).toBe(false);
  });
});
