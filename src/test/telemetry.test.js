import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isTelemetryEnabled,
  setTelemetryEnabled,
  readTelemetry,
  clearTelemetry,
  recordResultEvent,
  successRate,
} from '../lib/telemetry.js';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('telemetry — opt-in flag', () => {
  it('está desactivada por defecto', () => {
    expect(isTelemetryEnabled()).toBe(false);
  });

  it('se activa y persiste', () => {
    setTelemetryEnabled(true);
    expect(isTelemetryEnabled()).toBe(true);
  });

  it('se desactiva', () => {
    setTelemetryEnabled(true);
    setTelemetryEnabled(false);
    expect(isTelemetryEnabled()).toBe(false);
  });
});

describe('recordResultEvent — respeta el opt-in', () => {
  it('NO registra nada si la telemetría está apagada', () => {
    recordResultEvent({ tier: 'F', isWin: true, reasonCode: 'OK_ALLOW' });
    expect(readTelemetry().totalCommits).toBe(0);
  });

  it('registra un acierto cuando está activada', () => {
    setTelemetryEnabled(true);
    recordResultEvent({ tier: 'F', isWin: true, reasonCode: 'OK_ALLOW' });
    const data = readTelemetry();
    expect(data.totalCommits).toBe(1);
    expect(data.wins).toBe(1);
    expect(data.failures).toBe(0);
  });

  it('agrega por reasonCode y por tier', () => {
    setTelemetryEnabled(true);
    recordResultEvent({ tier: 'F', isWin: false, reasonCode: 'APP_MISMATCH' });
    recordResultEvent({ tier: 'F', isWin: false, reasonCode: 'APP_MISMATCH' });
    recordResultEvent({ tier: 'N', isWin: true, reasonCode: 'OK_ALLOW' });
    const data = readTelemetry();
    expect(data.byReason.APP_MISMATCH).toBe(2);
    expect(data.byTier.F).toEqual({ wins: 0, failures: 2 });
    expect(data.byTier.N).toEqual({ wins: 1, failures: 0 });
  });
});

describe('successRate', () => {
  it('devuelve null sin datos', () => {
    expect(successRate(readTelemetry())).toBeNull();
  });

  it('calcula el porcentaje de aciertos', () => {
    setTelemetryEnabled(true);
    recordResultEvent({ tier: 'F', isWin: true });
    recordResultEvent({ tier: 'F', isWin: true });
    recordResultEvent({ tier: 'F', isWin: false });
    expect(successRate(readTelemetry())).toBe(67);
  });
});

describe('clearTelemetry', () => {
  it('borra los datos agregados', () => {
    setTelemetryEnabled(true);
    recordResultEvent({ tier: 'F', isWin: true });
    clearTelemetry();
    expect(readTelemetry().totalCommits).toBe(0);
  });
});

describe('readTelemetry — robustez', () => {
  it('tolera JSON corrupto', () => {
    localStorage.setItem('panrules-gameos:telemetry:data:v1', '{bad');
    expect(readTelemetry().totalCommits).toBe(0);
  });
});
