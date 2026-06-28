// Estado de revisión SME por nivel, derivado de docs/accuracy-review.md
// (auditoría factual 2026-06-25, PAN-OS 11.x).
//
//   'pending'   — 🟡 matiz de precisión, pendiente de firma del autor (ninguno: R-04 cerrado).
//   'corrected' — ✅ corregido durante la auditoría factual (L4/L10 críticos; L15/L28 menores)
//                 + L25/L34/L38/L43 corregidos tras sign-off SME (Rodrigo, 2026-06-28; R-04 cerrado).
//   'verified'  — PASS (factual) para el resto.
//
// Mantener esta lista en sincronía con la tabla de accuracy-review.md.

export type SmeStatus = 'verified' | 'corrected' | 'pending';

export const SME_PENDING_IDS: number[] = [];
export const SME_CORRECTED_IDS = [4, 10, 15, 28, 25, 34, 38, 43];

const PENDING = new Set(SME_PENDING_IDS);
const CORRECTED = new Set(SME_CORRECTED_IDS);

export function smeStatusOf(levelId: number): SmeStatus {
  if (PENDING.has(levelId)) return 'pending';
  if (CORRECTED.has(levelId)) return 'corrected';
  return 'verified';
}
