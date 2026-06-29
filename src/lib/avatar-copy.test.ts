import { describe, it, expect } from 'vitest';
import { AVATAR_INTERVENTIONS, HINT_TOKEN } from './avatar-copy';

// R1/R4/R5 (bible §3) prohíben FRASES de culpa/examen, no palabras sueltas: "interfaz
// correcta" aparece VERBATIM en §4.2, así que la lista negra es por frase de examen
// ("respuesta correcta", "calificación", …), no por el substring "correcto" (que daría
// un falso positivo sobre el propio copy verbatim del bible).
const BANNED_PHRASES = [
  'fallaste',
  'te equivocaste',
  'cometiste un error',
  'lo hiciste mal',
  'deberías',
  'tendrías que',
  'respuesta incorrecta',
  'respuesta correcta',
  'apruebas',
  'repruebas',
  'reprobado',
  'nivel fallido',
  'calificación',
  'lo siento',
  'desafortunadamente',
  'qué pena',
  'me da pena',
];

function allStrings(): string[] {
  return [
    ...AVATAR_INTERVENTIONS.first_wrong,
    ...Object.values(AVATAR_INTERVENTIONS.second_wrong),
    ...AVATAR_INTERVENTIONS.third_wrong_frame,
    ...AVATAR_INTERVENTIONS.correct,
    ...AVATAR_INTERVENTIONS.level_complete,
    ...AVATAR_INTERVENTIONS.module_complete,
  ];
}

describe('avatar-copy (AC#3 — líneas verbatim de §4)', () => {
  it('expone todas las claves de intervención con contenido', () => {
    expect(AVATAR_INTERVENTIONS.first_wrong.length).toBeGreaterThanOrEqual(1);
    expect(AVATAR_INTERVENTIONS.third_wrong_frame.length).toBeGreaterThanOrEqual(1);
    expect(AVATAR_INTERVENTIONS.correct.length).toBeGreaterThanOrEqual(2);
    expect(AVATAR_INTERVENTIONS.module_complete.length).toBeGreaterThanOrEqual(1);
    expect(AVATAR_INTERVENTIONS).toHaveProperty('level_complete');
  });

  it('second_wrong cubre al menos ZONE/APP/NAT (las 3 líneas de concepto de §4.2)', () => {
    expect(AVATAR_INTERVENTIONS.second_wrong.ZONE_MISMATCH).toBeTruthy();
    expect(AVATAR_INTERVENTIONS.second_wrong.APP_MISMATCH).toBeTruthy();
    expect(AVATAR_INTERVENTIONS.second_wrong.NAT_MISMATCH).toBeTruthy();
  });

  it('el marco de tercer intento lleva el token de hint (valor de levels.ts, §4.8)', () => {
    expect(AVATAR_INTERVENTIONS.third_wrong_frame[0]).toContain(HINT_TOKEN);
  });

  it('ninguna línea está vacía', () => {
    for (const s of allStrings()) {
      expect(s.trim().length).toBeGreaterThan(0);
    }
  });

  it('ninguna línea usa frases prohibidas R1/R4/R5 (bible §3)', () => {
    for (const s of allStrings()) {
      const lower = s.toLowerCase();
      for (const banned of BANNED_PHRASES) {
        expect(lower.includes(banned), `frase prohibida "${banned}" en: ${s}`).toBe(false);
      }
    }
  });
});
