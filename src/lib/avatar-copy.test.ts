import { describe, it, expect } from 'vitest';
import {
  AVATAR_INTERVENTIONS,
  GLOBAL_INTERVENTIONS,
  HINT_TOKEN,
  STREAK_DAYS_TOKEN,
} from './avatar-copy';

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
    // EGC-17: las nueve líneas globales también se rigen por los principios bible §3.
    ...Object.values(GLOBAL_INTERVENTIONS),
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

describe('GLOBAL_INTERVENTIONS (EGC-17 — situaciones globales, VERBATIM de §4.1/§4.3/§4.4/§4.6)', () => {
  // Regression-guard del texto aprobado: la bible vive en feat/egc-2-avatar-bible, no en el
  // working tree, así que este test fija las nueve líneas verbatim. Un carácter de diferencia
  // (acentos, espacios, em-dash) rompe AC#1.
  it('§4.1 bienvenida día 1 es verbatim', () => {
    expect(GLOBAL_INTERVENTIONS.welcome_day1).toBe(
      'Hola, soy NORA. Voy a acompañarte mientras configuras políticas de seguridad en PAN-OS. El primer escenario es intencionalmente sencillo — su objetivo es que veas cómo funciona el motor, no que pongas a prueba tu memoria. ¿Arrancamos?'
    );
  });

  it('§4.3 milestones 3/7/14 son verbatim', () => {
    expect(GLOBAL_INTERVENTIONS.streak_3).toBe(
      'Tres dias seguidos. Eso no es suerte — es hábito. La práctica diaria retiene los conceptos dos veces mejor que los bloques largos espaciados.'
    );
    expect(GLOBAL_INTERVENTIONS.streak_7).toBe(
      'Una semana completa de práctica continua. En este momento tienes zonas, App-ID y servicios internalizados de una forma que no se puede fingir. Eso es tuyo.'
    );
    expect(GLOBAL_INTERVENTIONS.streak_14).toBe(
      'Dos semanas. El 14 % de los operadores que empiezan este programa llega aquí. No por talento — por constancia. El firewall ya no te parece una caja negra, ¿verdad?'
    );
  });

  it('§4.4 streak roto (corta y freeze) son verbatim', () => {
    expect(GLOBAL_INTERVENTIONS.broken_short).toBe(
      'Bienvenido de vuelta. Una pausa no borra lo que construiste — el cerebro consolida lo aprendido cuando descansas. ¿Dónde lo dejamos?'
    );
    expect(GLOBAL_INTERVENTIONS.broken_freeze).toBe(
      'Tu Freeze protegió la racha. Úsalo cuando lo necesites — esto no es una carrera. Lo importante es que volviste.'
    );
  });

  it('§4.6 pausa media (4-7 días) es verbatim', () => {
    expect(GLOBAL_INTERVENTIONS.pause_medium).toBe(
      'Llevas unos días fuera. Antes de avanzar, hagamos un repaso rápido de lo último que trabajamos — los conceptos se activan mejor cuando los revisamos al volver.'
    );
  });

  it('las líneas con [N] llevan el token de días (§4.4 broken_long, §4.6 pause_long)', () => {
    expect(GLOBAL_INTERVENTIONS.broken_long).toContain(STREAK_DAYS_TOKEN);
    expect(GLOBAL_INTERVENTIONS.pause_long).toContain(STREAK_DAYS_TOKEN);
    // El resto del texto es verbatim alrededor del token.
    expect(GLOBAL_INTERVENTIONS.broken_long).toBe(
      `Llevas unos días fuera y perdiste una racha de ${STREAK_DAYS_TOKEN} días. Eso duele un poco, lo sé. Pero los conceptos siguen ahí — empecemos con un nivel rápido de calentamiento antes de retomar donde estabas.`
    );
    expect(GLOBAL_INTERVENTIONS.pause_long).toBe(
      `Bienvenido de vuelta después de ${STREAK_DAYS_TOKEN} días. Es normal necesitar un momento para retomar el ritmo. Empecemos desde el último punto de control — sin prisa.`
    );
  });

  it('expone las nueve claves de situación global con contenido', () => {
    const keys = Object.keys(GLOBAL_INTERVENTIONS);
    expect(keys).toHaveLength(9);
    for (const v of Object.values(GLOBAL_INTERVENTIONS)) {
      expect(v.trim().length).toBeGreaterThan(0);
    }
  });
});
