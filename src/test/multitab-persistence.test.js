// Multi-tab write-guard regression test (PNR-24)
//
// REPRODUCIBLE RACE SCENARIO
// --------------------------
// Two same-origin browser tabs share one localStorage:
//   - Tab 1: a student PLAYING the game. Writes progress via useProgress
//     (recordAttempt / recordResult / markCompleted) under the key
//     'panrules-gameos:progress:v2', and learning aggregates via
//     telemetry.recordResultEvent under 'panrules-gameos:telemetry:data:v1'.
//   - Tab 2: the same student (or an instructor on the same machine) with a
//     SECOND game tab open while the Management Console (#/console) is also up.
//     This second playing tab ALSO writes 'panrules-gameos:progress:v2'.
//
// The pre-fix bug (read-whole-object → mutate-in-memory → write-whole-object):
// each tab mounted, read a snapshot of localStorage ONCE, and thereafter
// persisted its own in-memory snapshot. When Tab 2 wrote its (now stale)
// snapshot it CLOBBERED Tab 1's increments — last-write-wins lost updates.
// IndexedDB eval (PNR-2, NO-GO) named this as the one real correctness gap.
//
// The fix: every persist re-reads the current persisted value from localStorage
// immediately before writing and applies only THIS event's delta to that fresh
// value (counters additive, Sets union). Below we drive two concurrent writers
// against a shared jsdom localStorage and assert BOTH increments survive.
//
// Affected keys: 'panrules-gameos:progress:v2', 'panrules-gameos:telemetry:data:v1'.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from '../hooks/useProgress.js';
import {
  setTelemetryEnabled,
  readTelemetry,
  recordResultEvent,
  applyTelemetryDelta,
  mergeTelemetry,
} from '../lib/telemetry.js';

const PROGRESS_KEY = 'panrules-gameos:progress:v2';
const TELEMETRY_KEY = 'panrules-gameos:telemetry:data:v1';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

function readProgressRaw() {
  return JSON.parse(localStorage.getItem(PROGRESS_KEY));
}

describe('PNR-24 — useProgress no pierde incrementos entre dos pestañas', () => {
  it('dos pestañas que tocan niveles DISTINTOS conservan ambos intentos (no last-write-wins)', () => {
    // Ambas pestañas montan sobre el MISMO storage vacío: leen el mismo baseline.
    const tab1 = renderHook(() => useProgress());
    const tab2 = renderHook(() => useProgress());

    // Concurrencia simulada: tab1 cuenta un intento en el nivel 1, luego tab2
    // (que arrancó con el snapshot viejo) cuenta un intento en el nivel 2.
    act(() => {
      tab1.result.current.recordAttempt(1);
    });
    act(() => {
      tab2.result.current.recordAttempt(2);
    });

    // Con el patrón viejo, tab2 habría escrito {2:1} pisando {1:1}.
    const raw = readProgressRaw();
    expect(raw.attempts).toEqual({ 1: 1, 2: 1 });
  });

  it('dos pestañas que tocan el MISMO nivel suman ambos intentos (contador aditivo)', () => {
    const tab1 = renderHook(() => useProgress());
    const tab2 = renderHook(() => useProgress());

    act(() => {
      tab1.result.current.recordAttempt(1);
    });
    act(() => {
      tab2.result.current.recordAttempt(1);
    });

    // Ambos incrementos sobreviven: 1 + 1 = 2.
    expect(readProgressRaw().attempts[1]).toBe(2);
  });

  it('los Sets completed/scored se unen por unión entre pestañas', () => {
    const tab1 = renderHook(() => useProgress());
    const tab2 = renderHook(() => useProgress());

    act(() => {
      tab1.result.current.markCompleted(1);
    });
    act(() => {
      tab2.result.current.markCompleted(2);
    });

    const raw = readProgressRaw();
    expect(new Set(raw.completed)).toEqual(new Set([1, 2]));
  });

  it('recordResult de dos pestañas conserva intentos y completados de ambas', () => {
    const tab1 = renderHook(() => useProgress());
    const tab2 = renderHook(() => useProgress());

    act(() => {
      tab1.result.current.recordResult(1, true); // gana nivel 1
    });
    act(() => {
      tab2.result.current.recordResult(2, true); // gana nivel 2 (snapshot viejo)
    });

    const raw = readProgressRaw();
    expect(raw.attempts).toEqual({ 1: 1, 2: 1 });
    expect(new Set(raw.completed)).toEqual(new Set([1, 2]));
    expect(new Set(raw.scored)).toEqual(new Set([1, 2]));
    // Puntos de ambas pestañas presentes: 100 (nivel 1) + 100 (nivel 2).
    expect(raw.score).toBe(200);
  });

  it('demuestra que el patrón viejo (snapshot en memoria) SÍ perdía incrementos', () => {
    // Reproducción del bug original con escritura de snapshot completo:
    const tab1Snapshot = { levelIdx: 0, completed: [], attempts: { 1: 1 }, score: 0, scored: [] };
    const tab2Snapshot = { levelIdx: 0, completed: [], attempts: { 2: 1 }, score: 0, scored: [] };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(tab1Snapshot));
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(tab2Snapshot)); // pisa a tab1
    // El intento del nivel 1 se PERDIÓ con el patrón viejo:
    expect(readProgressRaw().attempts).toEqual({ 2: 1 });
    // Nuestro hook, en cambio, lo conserva (ver tests anteriores).
  });
});

describe('PNR-24 — telemetry escribe con merge idempotente aditivo', () => {
  it('dos escritores que leyeron el MISMO baseline conservan ambos eventos', () => {
    setTelemetryEnabled(true);
    // Baseline ya persistido por actividad previa.
    applyTelemetryDelta({ totalCommits: 5, wins: 5, failures: 0, byTier: { F: { wins: 5, failures: 0 } } });

    // Dos pestañas leen el MISMO baseline (5)...
    const baselineA = readTelemetry();
    const baselineB = readTelemetry();
    expect(baselineA.totalCommits).toBe(5);
    expect(baselineB.totalCommits).toBe(5);

    // ...y cada una registra su evento. La escritura re-lee fresco y suma el
    // delta, así que ninguna pisa a la otra.
    recordResultEvent({ tier: 'F', isWin: true, reasonCode: 'OK_ALLOW' });
    recordResultEvent({ tier: 'F', isWin: false, reasonCode: 'APP_MISMATCH' });

    const final = readTelemetry();
    expect(final.totalCommits).toBe(7); // 5 + 1 + 1, sin pérdidas
    expect(final.wins).toBe(6);
    expect(final.failures).toBe(1);
    expect(final.byReason.APP_MISMATCH).toBe(1);
  });

  it('un escritor de snapshot ingenuo HABRÍA perdido un evento (contraste con el merge)', () => {
    setTelemetryEnabled(true);
    applyTelemetryDelta({ totalCommits: 5, wins: 5, failures: 0 });

    // Patrón viejo: dos pestañas leen 5, ambas escriben 6 (snapshot completo).
    const a = readTelemetry();
    const b = readTelemetry();
    a.totalCommits += 1;
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(a)); // -> 6
    b.totalCommits += 1;
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(b)); // -> 6 (pisa: pérdida)
    expect(readTelemetry().totalCommits).toBe(6); // se perdió un evento

    // El merge aditivo, sobre el mismo baseline, no pierde nada:
    const merged = mergeTelemetry(
      mergeTelemetry({ totalCommits: 5, wins: 5, failures: 0, byReason: {}, byTier: {} }, { totalCommits: 1 }),
      { totalCommits: 1 }
    );
    expect(merged.totalCommits).toBe(7);
  });
});
