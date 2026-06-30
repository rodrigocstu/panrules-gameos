import { describe, it, expect } from 'vitest';
import { computeD3Retention, summarizeCohort, type CohortEvent } from './retention';

describe('retention — computeD3Retention (EGC-12, instrumento de D3 ≥ 30%)', () => {
  it('cohorte de 4, 2 retenidos en el día 3 → 0.5', () => {
    const events: CohortEvent[] = [
      { userId: 'a', dayOffset: 0 },
      { userId: 'b', dayOffset: 0 },
      { userId: 'c', dayOffset: 0 },
      { userId: 'd', dayOffset: 0 },
      { userId: 'a', dayOffset: 3 },
      { userId: 'b', dayOffset: 3 },
      { userId: 'c', dayOffset: 5 }, // vuelve, pero fuera de la ventana D3
    ];
    expect(computeD3Retention(events)).toBe(0.5);
  });

  it('cohorte vacía → 0 (sin división por cero, no NaN)', () => {
    expect(computeD3Retention([])).toBe(0);
    expect(Number.isNaN(computeD3Retention([]))).toBe(false);
    // eventos solo en el día 3 sin nadie en el día 0 → cohorte 0
    expect(computeD3Retention([{ userId: 'x', dayOffset: 3 }])).toBe(0);
  });

  it('no cuenta dos veces a un usuario con varios eventos el mismo día', () => {
    const events: CohortEvent[] = [
      { userId: 'a', dayOffset: 0 },
      { userId: 'a', dayOffset: 0 },
      { userId: 'a', dayOffset: 3 },
      { userId: 'a', dayOffset: 3 },
    ];
    const r = summarizeCohort(events);
    expect(r.cohortSize).toBe(1);
    expect(r.retained).toBe(1);
    expect(r.d3).toBe(1);
  });

  it('la ventana es configurable (window=7 para D7)', () => {
    const events: CohortEvent[] = [
      { userId: 'a', dayOffset: 0 },
      { userId: 'b', dayOffset: 0 },
      { userId: 'a', dayOffset: 7 },
    ];
    expect(computeD3Retention(events, 7)).toBe(0.5);
  });

  it('el umbral de negocio D3 ≥ 30% es evaluable sobre el ratio', () => {
    const events: CohortEvent[] = [
      { userId: 'a', dayOffset: 0 },
      { userId: 'b', dayOffset: 0 },
      { userId: 'c', dayOffset: 0 },
      { userId: 'a', dayOffset: 3 },
    ];
    expect(computeD3Retention(events)).toBeCloseTo(1 / 3, 5);
    expect(computeD3Retention(events) >= 0.3).toBe(true);
  });
});
