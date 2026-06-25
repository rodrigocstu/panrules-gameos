import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from '../hooks/useProgress.js';

const STORAGE_KEY = 'palo-rules-game:progress:v1';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('useProgress — estado inicial', () => {
  it('arranca en levelIdx 0 sin completados ni intentos', () => {
    const { result } = renderHook(() => useProgress());
    expect(result.current.levelIdx).toBe(0);
    expect(result.current.completed.size).toBe(0);
    expect(result.current.attempts).toEqual({});
  });
});

describe('useProgress — setLevelIdx persiste en localStorage', () => {
  it('guarda el nuevo índice y lo recupera al montar de nuevo', () => {
    const { result, unmount } = renderHook(() => useProgress());
    act(() => {
      result.current.setLevelIdx(3);
    });
    expect(result.current.levelIdx).toBe(3);

    // Simular recarga: montar un nuevo hook con el storage ya escrito.
    unmount();
    const { result: result2 } = renderHook(() => useProgress());
    expect(result2.current.levelIdx).toBe(3);
  });
});

describe('useProgress — markCompleted persiste completados', () => {
  it('añade el id al Set y lo recupera tras remontar', () => {
    const { result, unmount } = renderHook(() => useProgress());
    act(() => {
      result.current.markCompleted(1);
      result.current.markCompleted(2);
    });
    expect(result.current.completed.has(1)).toBe(true);
    expect(result.current.completed.has(2)).toBe(true);

    unmount();
    const { result: result2 } = renderHook(() => useProgress());
    expect(result2.current.completed.has(1)).toBe(true);
    expect(result2.current.completed.has(2)).toBe(true);
    expect(result2.current.completed.has(3)).toBe(false);
  });

  it('llamar markCompleted dos veces con el mismo id no añade duplicados', () => {
    const { result } = renderHook(() => useProgress());
    act(() => {
      result.current.markCompleted(1);
      result.current.markCompleted(1);
    });
    expect(result.current.completed.size).toBe(1);
  });
});

describe('useProgress — recordAttempt acumula intentos', () => {
  it('acumula el contador y persiste', () => {
    const { result, unmount } = renderHook(() => useProgress());
    act(() => {
      result.current.recordAttempt(1);
      result.current.recordAttempt(1);
      result.current.recordAttempt(2);
    });
    expect(result.current.attempts[1]).toBe(2);
    expect(result.current.attempts[2]).toBe(1);

    unmount();
    const { result: result2 } = renderHook(() => useProgress());
    expect(result2.current.attempts[1]).toBe(2);
    expect(result2.current.attempts[2]).toBe(1);
  });
});

describe('useProgress — reset borra todo', () => {
  it('vuelve al estado inicial y elimina la clave del localStorage', () => {
    const { result } = renderHook(() => useProgress());
    act(() => {
      result.current.setLevelIdx(4);
      result.current.markCompleted(1);
      result.current.recordAttempt(1);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.levelIdx).toBe(0);
    expect(result.current.completed.size).toBe(0);
    expect(result.current.attempts).toEqual({});
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('useProgress — tolerancia a datos corruptos en localStorage', () => {
  it('ignora JSON inválido y arranca con estado limpio', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json}');
    const { result } = renderHook(() => useProgress());
    expect(result.current.levelIdx).toBe(0);
    expect(result.current.completed.size).toBe(0);
  });

  it('ignora un objeto con esquema incorrecto', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    const { result } = renderHook(() => useProgress());
    expect(result.current.levelIdx).toBe(0);
  });
});
