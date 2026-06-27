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

// Registra el resultado de un commit como agregado. No-op si no hay opt-in.
export function recordResultEvent({ tier = 'F', isWin, reasonCode }) {
  if (!isTelemetryEnabled()) return;
  const data = readTelemetry();
  data.totalCommits += 1;
  if (isWin) data.wins += 1;
  else data.failures += 1;

  if (reasonCode) {
    data.byReason[reasonCode] = (data.byReason[reasonCode] ?? 0) + 1;
  }
  const t = data.byTier[tier] ?? { wins: 0, failures: 0 };
  if (isWin) t.wins += 1;
  else t.failures += 1;
  data.byTier[tier] = t;

  write(data);
}

// Tasa de éxito global (0–100), o null si no hay datos.
export function successRate(data = readTelemetry()) {
  if (data.totalCommits === 0) return null;
  return Math.round((data.wins / data.totalCommits) * 100);
}
