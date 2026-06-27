import { PROFILE_RANK } from '../data/constants';

// Adaptive Policy Tutor — modo OFFLINE (concepto disruptivo 5.1).
//
// Genera retroalimentación adaptativa comparando la configuración que el jugador
// envió con la solución del nivel, campo por campo. No requiere red: es la base
// pedagógica que siempre funciona; el modo IA (Cloudflare Worker) es una mejora
// opcional sobre esto.

// Compara la config con la solución y devuelve la lista de campos divergentes.
// Cada diff: { field, your, correct }. El perfil usa semántica de rango (≥).
export function diffConfig(config, solution) {
  const diffs = [];
  if (!config || !solution) return diffs;

  const simpleFields = ['srcZone', 'dstZone', 'app', 'service', 'action', 'nat'];
  for (const field of simpleFields) {
    if (config[field] !== solution[field]) {
      diffs.push({ field, your: config[field], correct: solution[field] });
    }
  }

  // Perfil: PAN-OS exige "al menos" el perfil requerido (semántica de rango).
  // 'any' significa irrelevante: no se evalúa.
  if (solution.profile && solution.profile !== 'any') {
    const required = PROFILE_RANK[solution.profile] ?? 0;
    const provided = PROFILE_RANK[config.profile] ?? 0;
    if (provided < required) {
      diffs.push({ field: 'profile', your: config.profile, correct: solution.profile });
    }
  }

  return diffs;
}

// Devuelve consejos estructurados para el componente.
//   { correct: boolean, diffs: Diff[] }
export function buildTutorAdvice(level, config) {
  const solution = level?.solution;
  const diffs = diffConfig(config, solution);
  return { correct: diffs.length === 0, diffs };
}
