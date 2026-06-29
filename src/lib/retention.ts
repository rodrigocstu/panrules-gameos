// retention — utilidad pura de retención D3 de cohorte (EGC-12, instrumento de AC#1).
//
// D3 de cohorte: de los usuarios activos en su día de registro (dayOffset 0), qué fracción
// vuelve a estar activa `window` días después. Pura sobre eventos `level_completed` ya
// anotados por el Worker con su dayOffset (días civiles desde users.createdAt); el JOIN pesado
// vive en el Worker, la aritmética testeable aquí (plan C2). Devuelve 0 (no NaN) si cohorte=0.
//
// NOTA de diseño: la firma opera sobre CohortEvent[] (userId + dayOffset) y no sobre
// MetricEvent[] crudo, porque el día-desde-registro requiere users.createdAt, que MetricEvent
// no lleva; el Worker calcula el offset vía SQL y la util hace la aritmética de cohorte.

export interface CohortEvent {
  userId: string;
  /** Días civiles enteros desde el registro del usuario hasta el evento. 0 = día de registro. */
  dayOffset: number;
}

export interface CohortRetentionResult {
  window: number;
  cohortSize: number;
  retained: number;
  /** retained / cohortSize, 0 cuando la cohorte está vacía (sin división por cero). */
  d3: number;
}

/** Ventana por defecto de la métrica D3 (3 días tras el registro). */
export const D3_WINDOW = 3;

/** Resumen de cohorte (tamaño, retenidos, ratio D3). Base de `computeD3Retention`. */
export function summarizeCohort(
  events: CohortEvent[],
  window: number = D3_WINDOW
): CohortRetentionResult {
  const cohort = new Set<string>();
  const returned = new Set<string>();
  for (const e of events) {
    if (e.dayOffset === 0) cohort.add(e.userId);
    if (e.dayOffset === window) returned.add(e.userId);
  }
  let retained = 0;
  for (const u of cohort) if (returned.has(u)) retained += 1;
  const cohortSize = cohort.size;
  return { window, cohortSize, retained, d3: cohortSize === 0 ? 0 : retained / cohortSize };
}

/** Fracción D3 (0–1) a partir de eventos de cohorte. 0 si la cohorte está vacía. */
export function computeD3Retention(events: CohortEvent[], window: number = D3_WINDOW): number {
  return summarizeCohort(events, window).d3;
}
