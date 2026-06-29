import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  parseRoute,
  navigateTo,
  useHashRoute,
  isProtectedRoute,
} from '../hooks/useHashRoute.js';

beforeEach(() => {
  window.location.hash = '';
});
afterEach(() => {
  window.location.hash = '';
});

describe('parseRoute', () => {
  it('reconoce #/console como ruta console', () => {
    expect(parseRoute('#/console')).toBe('console');
  });

  it('reconoce #console (sin slash) como console', () => {
    expect(parseRoute('#console')).toBe('console');
  });

  it('ignora query params al parsear', () => {
    expect(parseRoute('#/console?tab=x')).toBe('console');
  });

  it('devuelve game para hash vacío', () => {
    expect(parseRoute('')).toBe('game');
  });

  it('devuelve game para #/', () => {
    expect(parseRoute('#/')).toBe('game');
  });

  it('reconoce #/warroom como ruta warroom', () => {
    expect(parseRoute('#/warroom')).toBe('warroom');
  });

  it('reconoce #/nat como ruta nat (módulo La Centralita, EGC-12)', () => {
    expect(parseRoute('#/nat')).toBe('nat');
  });

  it('reconoce #/policy como ruta policy (módulo Políticas de Red, EGC-18)', () => {
    expect(parseRoute('#/policy')).toBe('policy');
  });

  it('reconoce #/firewall como ruta firewall (módulo El Portero, EGC-19)', () => {
    expect(parseRoute('#/firewall')).toBe('firewall');
  });

  it('devuelve game para rutas desconocidas', () => {
    expect(parseRoute('#/whatever')).toBe('game');
  });

  it('tolera undefined/null', () => {
    expect(parseRoute(undefined)).toBe('game');
    expect(parseRoute(null)).toBe('game');
  });
});

describe('navigateTo', () => {
  it('pone el hash en #/console al navegar a console', () => {
    navigateTo('console');
    expect(window.location.hash).toBe('#/console');
  });

  it('pone el hash en #/ al navegar a game', () => {
    window.location.hash = '#/console';
    navigateTo('game');
    expect(window.location.hash).toBe('#/');
  });

  it('pone el hash en #/warroom al navegar a warroom', () => {
    navigateTo('warroom');
    expect(window.location.hash).toBe('#/warroom');
  });

  it('pone el hash en #/nat al navegar a nat', () => {
    navigateTo('nat');
    expect(window.location.hash).toBe('#/nat');
  });

  it('pone el hash en #/policy al navegar a policy', () => {
    navigateTo('policy');
    expect(window.location.hash).toBe('#/policy');
  });
});

describe('isProtectedRoute', () => {
  it('nat es una ruta protegida (EGC-12)', () => {
    expect(isProtectedRoute('nat')).toBe(true);
  });

  it('policy es una ruta protegida (EGC-18)', () => {
    expect(isProtectedRoute('policy')).toBe(true);
  });

  it('firewall es una ruta protegida (EGC-19)', () => {
    expect(isProtectedRoute('firewall')).toBe(true);
  });

  it('game no es una ruta protegida', () => {
    expect(isProtectedRoute('game')).toBe(false);
  });
});

describe('useHashRoute', () => {
  it('arranca en game cuando no hay hash', () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toBe('game');
  });

  it('arranca en console cuando el hash es #/console', () => {
    window.location.hash = '#/console';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toBe('console');
  });

  it('reacciona al cambio de hash (hashchange es asíncrono en jsdom)', async () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toBe('game');
    act(() => {
      result.current[1]('console');
    });
    await waitFor(() => expect(result.current[0]).toBe('console'));
  });

  it('vuelve a game al navegar de regreso', async () => {
    window.location.hash = '#/console';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toBe('console');
    act(() => {
      result.current[1]('game');
    });
    await waitFor(() => expect(result.current[0]).toBe('game'));
  });
});
