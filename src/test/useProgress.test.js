import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from '../hooks/useProgress.js';

const STORAGE_KEY = 'panrules-gameos:progress:v2';

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

describe('useProgress — puntuación y racha (T3.7)', () => {
  it('recordResult ganando al primer intento otorga 100 puntos y racha 1', () => {
    const { result } = renderHook(() => useProgress());
    act(() => {
      result.current.recordResult(1, true);
    });
    expect(result.current.score).toBe(100);
    expect(result.current.streak).toBe(1);
    expect(result.current.bestStreak).toBe(1);
    expect(result.current.completed.has(1)).toBe(true);
    expect(result.current.attempts[1]).toBe(1);
  });

  it('penaliza intentos fallidos previos: fallo + acierto en el mismo nivel = 80 puntos', () => {
    const { result } = renderHook(() => useProgress());
    act(() => {
      result.current.recordResult(1, false); // intento 1: falla -> racha 0
      result.current.recordResult(1, true); // intento 2: acierta -> 100 - 20
    });
    expect(result.current.attempts[1]).toBe(2);
    expect(result.current.score).toBe(80);
    expect(result.current.streak).toBe(1);
  });

  it('la racha sube con aciertos seguidos y se reinicia al fallar; bestStreak se conserva', () => {
    const { result } = renderHook(() => useProgress());
    act(() => {
      result.current.recordResult(1, true);
      result.current.recordResult(2, true);
    });
    expect(result.current.streak).toBe(2);
    expect(result.current.bestStreak).toBe(2);

    act(() => {
      result.current.recordResult(3, false);
    });
    expect(result.current.streak).toBe(0);
    expect(result.current.bestStreak).toBe(2);
  });

  it('rejugar un nivel ya puntuado no vuelve a sumar puntos', () => {
    const { result } = renderHook(() => useProgress());
    act(() => {
      result.current.recordResult(1, true); // +100
      result.current.recordResult(1, true); // ya puntuado: +0
    });
    expect(result.current.score).toBe(100);
  });

  it('persiste score, streak y bestStreak tras remontar', () => {
    const { result, unmount } = renderHook(() => useProgress());
    act(() => {
      result.current.recordResult(1, true);
      result.current.recordResult(2, true);
    });
    unmount();
    const { result: result2 } = renderHook(() => useProgress());
    expect(result2.current.score).toBe(200);
    expect(result2.current.bestStreak).toBe(2);
  });
});
