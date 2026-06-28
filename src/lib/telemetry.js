// Telemetría anónima opt-in (WBS 6.3) — 100% local, sin red, sin PII.
//
// Cuando el usuario la activa, el juego acumula CONTADORES AGREGADOS de aprendizaje
// (commits totales, aciertos/fallos, fallos por reasonCode, aciertos/fallos por tier).
// No se registran nombres, IPs (las del juego son ficticias), ni timestamps que
// identifiquen una sesión: solo agregados que ayudan a detectar niveles difíciles.
//
// Está OFF por defecto. recordResultEvent() es un no-op si no se ha dado opt-in.

const FLAG = 'panrules-gameos:telemetry:v1';
const DATA = 'panrules-gameos:telemetry:data:v1';

export const EMPTY_TELEMETRY = {
  totalCommits: 0,
  wins: 0,
  failures: 0,
  byReason: {},
  byTier: {},
};

export function isTelemetryEnabled() {
  try {
    return localStorage.getItem(FLAG) === 'true';
  } catch {
    return false;
  }
}

export function setTelemetryEnabled(on) {
  try {
    localStorage.setItem(FLAG, on ? 'true' : 'false');
  } catch {
    // Silencioso.
  }
}

export function readTelemetry() {
  try {
    const raw = localStorage.getItem(DATA);
    if (!raw) return { ...EMPTY_TELEMETRY, byReason: {}, byTier: {} };
    const parsed = JSON.parse(raw);
    return {
      totalCommits: parsed.totalCommits ?? 0,
      wins: parsed.wins ?? 0,
      failures: parsed.failures ?? 0,
      byReason: parsed.byReason ?? {},
      byTier: parsed.byTier ?? {},
    };
  } catch {
    return { ...EMPTY_TELEMETRY, byReason: {}, byTier: {} };
  }
}

function write(data) {
  try {
    localStorage.setItem(DATA, JSON.stringify(data));
  } catch {
    // Silencioso.
  }
}

export function clearTelemetry() {
  try {
    localStorage.removeItem(DATA);
  } catch {
    // Silencioso.
  }
}

// Suma un delta de evento sobre una base de contadores. Función pura y
// commutativa: todos los campos son contadores aditivos, así que aplicar dos
// deltas en cualquier orden produce el mismo agregado (merge idempotente por
// evento). Exportada para que el test multi-pestaña pueda razonar sobre ella.
export function mergeTelemetry(base, delta) {
  const byReason = { ...base.byReason };
  for (const [code, n] of Object.entries(delta.byReason ?? {})) {
    byReason[code] = (byReason[code] ?? 0) + n;
  }
  const byTier = { ...base.byTier };
  for (const [tier, tv] of Object.entries(delta.byTier ?? {})) {
    const cur = byTier[tier] ?? { wins: 0, failures: 0 };
    byTier[tier] = {
      wins: cur.wins + (tv.wins ?? 0),
      failures: cur.failures + (tv.failures ?? 0),
    };
  }
  return {
    totalCommits: base.totalCommits + (delta.totalCommits ?? 0),
    wins: base.wins + (delta.wins ?? 0),
    failures: base.failures + (delta.failures ?? 0),
    byReason,
    byTier,
  };
}

// Aplica el delta de UN evento al valor PERSISTIDO actual: re-lee fresco desde
// localStorage justo antes de escribir y suma el delta sobre ese valor (no sobre
// un snapshot en memoria que puede estar viejo). Esto cierra la carrera
// read-modify-write entre pestañas: si otra pestaña incrementó entre nuestra
// lectura inicial y nuestra escritura, leemos su valor fresco y le sumamos el
// nuestro en vez de pisarlo. Totalmente síncrono (sin red, sin async).
export function applyTelemetryDelta(delta) {
  write(mergeTelemetry(readTelemetry(), delta));
}

// Registra el resultado de un commit como agregado. No-op si no hay opt-in.
// El evento se traduce a un delta aditivo y se aplica exactamente una vez sobre
// el valor persistido fresco (read-fresh → add this delta → write).
export function recordResultEvent({ tier = 'F', isWin, reasonCode }) {
  if (!isTelemetryEnabled()) return;
  applyTelemetryDelta({
    totalCommits: 1,
    wins: isWin ? 1 : 0,
    failures: isWin ? 0 : 1,
    byReason: reasonCode ? { [reasonCode]: 1 } : {},
    byTier: { [tier]: { wins: isWin ? 1 : 0, failures: isWin ? 0 : 1 } },
  });
}

// Tasa de éxito global (0–100), o null si no hay datos.
export function successRate(data = readTelemetry()) {
  if (data.totalCommits === 0) return null;
  return Math.round((data.wins / data.totalCommits) * 100);
}
