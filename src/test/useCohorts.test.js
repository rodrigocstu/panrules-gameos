import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCohorts, loadCohorts, makeCohortId } from '../hooks/useCohorts.js';

const STORAGE_KEY = 'panrules-gameos:cohorts:v1';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  localStorage.clear();
});

describe('loadCohorts', () => {
  it('devuelve [] sin datos', () => {
    expect(loadCohorts()).toEqual([]);
  });

  it('tolera JSON corrupto', () => {
    localStorage.setItem(STORAGE_KEY, '{bad');
    expect(loadCohorts()).toEqual([]);
  });

  it('tolera un valor que no es array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 1 }));
    expect(loadCohorts()).toEqual([]);
  });
});

describe('makeCohortId', () => {
  it('genera ids únicos en sucesión', () => {
    const a = makeCohortId();
    const b = makeCohortId();
    expect(a).not.toBe(b);
  });
});

describe('useCohorts — alta', () => {
  it('arranca vacío', () => {
    const { result } = renderHook(() => useCohorts());
    expect(result.current.cohorts).toEqual([]);
  });

  it('añade un cohort con nombre y track', () => {
    const { result } = renderHook(() => useCohorts());
    act(() => result.current.addCohort('Bootcamp', 'netsec-architect'));
    expect(result.current.cohorts).toHaveLength(1);
    expect(result.current.cohorts[0].name).toBe('Bootcamp');
    expect(result.current.cohorts[0].track).toBe('netsec-architect');
  });

  it('usa track por defecto si no se especifica', () => {
    const { result } = renderHook(() => useCohorts());
    act(() => result.current.addCohort('X'));
    expect(result.current.cohorts[0].track).toBe('ngfw-engineer');
  });

  it('recorta el nombre y usa fallback si queda vacío', () => {
    const { result } = renderHook(() => useCohorts());
    act(() => result.current.addCohort('   ', 'ngfw-engineer'));
    expect(result.current.cohorts[0].name).toBe('Cohort');
  });

  it('persiste el cohort en localStorage', () => {
    const { result } = renderHook(() => useCohorts());
    act(() => result.current.addCohort('Persisted', 'ngfw-engineer'));
    expect(loadCohorts()).toHaveLength(1);
  });
});

describe('useCohorts — edición y borrado', () => {
  it('actualiza el track de un cohort existente', () => {
    const { result } = renderHook(() => useCohorts());
    act(() => result.current.addCohort('C1', 'ngfw-engineer'));
    const id = result.current.cohorts[0].id;
    act(() => result.current.updateCohort(id, { track: 'netsec-architect' }));
    expect(result.current.cohorts[0].track).toBe('netsec-architect');
  });

  it('elimina un cohort por id', () => {
    const { result } = renderHook(() => useCohorts());
    act(() => result.current.addCohort('C1', 'ngfw-engineer'));
    act(() => result.current.addCohort('C2', 'ngfw-engineer'));
    const idToRemove = result.current.cohorts[0].id;
    act(() => result.current.removeCohort(idToRemove));
    expect(result.current.cohorts).toHaveLength(1);
    expect(result.current.cohorts[0].name).toBe('C2');
  });

  it('persiste el estado tras remontar (3 cohorts demo)', () => {
    const { result, unmount } = renderHook(() => useCohorts());
    act(() => {
      result.current.addCohort('Cohort A', 'ngfw-engineer');
      result.current.addCohort('Cohort B', 'netsec-architect');
      result.current.addCohort('Cohort C', 'ngfw-engineer');
    });
    unmount();
    const { result: result2 } = renderHook(() => useCohorts());
    expect(result2.current.cohorts).toHaveLength(3);
  });
});
