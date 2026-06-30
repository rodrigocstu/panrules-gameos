// Microcopy de las intervenciones del avatar NORA para el módulo Firewall (EGC-11).
//
// AC#3: todas las líneas son VERBATIM de docs/avatar-personality-bible.md §4 (rama
// feat/egc-2-avatar-bible). No se redacta copy nuevo aquí. Estructura derivada de la
// "Escalonamiento de la información" del bible §5: 3 niveles de pista por error.
//
// GAP documentado (gate AC#3): §4.2 sólo provee línea de CONCEPTO verbatim para tres
// reasonCodes (ZONE/APP/NAT). Las líneas de ACTION/SERVICE/PROFILE_* las debe aportar
// UXW y añadirlas a §4 antes del merge; mientras tanto el hook degrada al mensaje
// genérico de §4.2 (ver useAvatarInterventions). No se inventa copy para rellenar.

import type { ReasonCode } from '../types/domain';

export type AvatarInterventionKey =
  | 'first_wrong'
  | 'second_wrong'
  | 'third_wrong'
  | 'correct'
  | 'level_complete'
  | 'module_complete';

/**
 * Sentinela dentro del marco verbatim de §4.8. En tiempo de ejecución se reemplaza por
 * `pickText(level.hint, lang)` — realiza el hueco "[campo exacto de levels.ts]" del bible,
 * NO es copy nuevo.
 */
export const HINT_TOKEN = '{hint}';

/**
 * Sentinela para el `[N]` de la bible §4.4/§4.6 (espejo de `HINT_TOKEN`). En tiempo de
 * disparo se reemplaza por el número real: en §4.4 (`broken_long`) por `currentStreak`
 * (racha a punto de perderse), en §4.6 (`pause_long`) por `gap` (días de ausencia). NO es
 * copy nuevo — sólo rellena el hueco que la bible deja escrito como `[N]`.
 */
export const STREAK_DAYS_TOKEN = '{n}';

export interface AvatarInterventionCopy {
  /** §4.2 [PRIMER ERROR — primer intento fallido, generico]. */
  first_wrong: string[];
  /** §4.2, línea de concepto seleccionada por verdict.reasonCode (hoy ZONE/APP/NAT). */
  second_wrong: Partial<Record<ReasonCode, string>>;
  /** §4.8, marco de indicación directa; {hint} ← pickText(level.hint). */
  third_wrong_frame: string[];
  /** §4.7 [LOGRO INTERMEDIO]; idx 0 = 2.º intento, idx 1 = 3.er intento+. */
  correct: string[];
  /** §4 es delgado aquí (gap menor para UXW; no bloquea AC#2). */
  level_complete: string[];
  /** §4.5 [LOGRO DE MODULO — completar El Portero]. */
  module_complete: string[];
}

export const AVATAR_INTERVENTIONS: AvatarInterventionCopy = {
  first_wrong: [
    'El paquete fue bloqueado. Eso significa que algún campo de la política no coincide con lo que el firewall espera ver. En PAN-OS, el motor evalúa zona origen, zona destino, aplicación y acción en ese orden. ¿Cuál campo revisamos primero?',
  ],
  second_wrong: {
    ZONE_MISMATCH:
      'El paquete llegó a la interfaz correcta, pero la política dice que no puede pasar. Revisa a qué zona está asignada la interfaz de destino.',
    APP_MISMATCH:
      'La política tiene allow, pero el firewall vio una aplicación diferente a la que pusiste. PAN-OS identifica aplicaciones por comportamiento, no por puerto. ¿Qué aplicación está realmente viajando en este paquete?',
    NAT_MISMATCH:
      'La security policy está bien configurada, pero el paquete no llegó a su destino. ¿Revisaste si el NAT Rulebase tiene una regla que maneje esta traducción de dirección?',
  },
  third_wrong_frame: [
    `Te lo señalo directamente: ${HINT_TOKEN}. Pruébalo y observa qué hace el motor.`,
  ],
  correct: [
    'Ahí está. El segundo intento tiene algo especial: ya sabías qué no funcionaba. Ese proceso de eliminación es el 80 % del troubleshooting real.',
    'Tomó tres rondas, pero lo resolviste con información progresiva — exactamente como funciona el análisis de logs en producción. Cada intento fue útil.',
  ],
  level_complete: [],
  module_complete: [
    'Completaste El Portero. Ya no es teoría: configuraste zonas reales, manejaste el deny implícito y entendiste por qué PAN-OS necesita conocer origen y destino antes de dejar pasar un paquete. Ese es un fundamento que no se improvisa.',
  ],
};

// Copy del módulo NAT "La Centralita" (EGC-12). Las líneas in-level (first/second/third_wrong,
// correct) son DETERMINISTAS por `verdict.reasonCode` del motor e idénticas entre módulos
// (NAT_MISMATCH ya está en AVATAR_INTERVENTIONS.second_wrong), así que se heredan tal cual; SOLO
// `module_complete` es específico de La Centralita. Se parametriza `useAvatarInterventions(copy)`
// en vez de mutar el const compartido, para no acoplar la integración de avatar de EGC-13.
//
// La línea `module_complete` es VERBATIM de docs/avatar-personality-bible.md §4.5 "[LOGRO DE
// MODULO — completar modulo NAT]" (rama feat/egc-2-avatar-bible). No se redacta copy nuevo
// (Iron Law / gate UXW). Pendiente: sign-off escrito de UXW antes del merge, igual que EGC-11.
export const NAT_INTERVENTIONS: AvatarInterventionCopy = {
  ...AVATAR_INTERVENTIONS,
  module_complete: [
    'Terminaste el módulo de NAT. SNAT, DNAT, y el que más confunde a todos — el U-Turn. Ya sabes cuándo PAN-OS aplica la traducción y cómo afecta las zonas en la security policy. Eso es exactamente lo que distingue a un operador que configura de uno que entiende.',
  ],
};

// Copy del módulo "Políticas de Red" (orden y shadowing, EGC-18). Las líneas in-level
// (first/second/third_wrong, correct) son DETERMINISTAS por `verdict.reasonCode` del motor e
// idénticas entre módulos, así que se heredan tal cual de AVATAR_INTERVENTIONS; SOLO
// `module_complete` sería específico de este módulo.
//
// GATE UXW (igual que EGC-11/EGC-12): la bible §4.5 (docs/avatar-personality-bible.md, rama
// feat/egc-2-avatar-bible) NO tiene línea "[LOGRO DE MODULO — Políticas de Red]". Por el Iron Law
// / norma no-new-copy NO se inventa la línea aquí: `module_complete` se ship VACÍO y la pantalla
// final degrada sin burbuja (useAvatarInterventions hace `?? null` y AvatarIntervention no
// renderiza con message vacío). Cuando UXW redacte+firme la línea verbatim, se rellena este array.
export const POLICY_INTERVENTIONS: AvatarInterventionCopy = {
  ...AVATAR_INTERVENTIONS,
  module_complete: [],
};

// Situaciones GLOBALES del avatar NORA (EGC-17). A diferencia de AVATAR_INTERVENTIONS/
// NAT_INTERVENTIONS (in-level, disparadas por el motor de un módulo), estas líneas se
// disparan desde superficies globales (AppShell/useStreak) según señales de racha. Las
// nueve líneas son VERBATIM de docs/avatar-personality-bible.md §4.1/§4.3/§4.4/§4.6 (rama
// feat/egc-2-avatar-bible). No se redacta copy nuevo (Iron Law / gate UXW). `broken_long`
// y `pause_long` llevan STREAK_DAYS_TOKEN donde la bible escribe `[N]`. Pendiente: sign-off
// escrito de UXW del 100% del microcopy antes del merge, igual que EGC-11/12.
export interface GlobalAvatarSituationCopy {
  /** §4.1 [BIENVENIDA DIA 1 — primera apertura, sin historial]. */
  welcome_day1: string;
  /** §4.3 [STREAK MANTENIDO — 3 dias consecutivos]. */
  streak_3: string;
  /** §4.3 [STREAK MANTENIDO — 7 dias consecutivos]. */
  streak_7: string;
  /** §4.3 [STREAK MANTENIDO — 14 dias consecutivos]. */
  streak_14: string;
  /** §4.4 [STREAK ROTO — pausa de 1-2 dias]. */
  broken_short: string;
  /** §4.4 [STREAK ROTO — con Streak-Freeze consumido]. */
  broken_freeze: string;
  /** §4.4 [STREAK ROTO — pausa de 3-6 dias, racha mayor a 5]; `{n}` ← currentStreak. */
  broken_long: string;
  /** §4.6 [PAUSA LARGA — 4-7 dias sin actividad]. */
  pause_medium: string;
  /** §4.6 [PAUSA LARGA — mas de 7 dias sin actividad]; `{n}` ← gap de días. */
  pause_long: string;
}

export const GLOBAL_INTERVENTIONS: GlobalAvatarSituationCopy = {
  welcome_day1:
    'Hola, soy NORA. Voy a acompañarte mientras configuras políticas de seguridad en PAN-OS. El primer escenario es intencionalmente sencillo — su objetivo es que veas cómo funciona el motor, no que pongas a prueba tu memoria. ¿Arrancamos?',
  streak_3:
    'Tres dias seguidos. Eso no es suerte — es hábito. La práctica diaria retiene los conceptos dos veces mejor que los bloques largos espaciados.',
  streak_7:
    'Una semana completa de práctica continua. En este momento tienes zonas, App-ID y servicios internalizados de una forma que no se puede fingir. Eso es tuyo.',
  streak_14:
    'Dos semanas. El 14 % de los operadores que empiezan este programa llega aquí. No por talento — por constancia. El firewall ya no te parece una caja negra, ¿verdad?',
  broken_short:
    'Bienvenido de vuelta. Una pausa no borra lo que construiste — el cerebro consolida lo aprendido cuando descansas. ¿Dónde lo dejamos?',
  broken_freeze:
    'Tu Freeze protegió la racha. Úsalo cuando lo necesites — esto no es una carrera. Lo importante es que volviste.',
  broken_long: `Llevas unos días fuera y perdiste una racha de ${STREAK_DAYS_TOKEN} días. Eso duele un poco, lo sé. Pero los conceptos siguen ahí — empecemos con un nivel rápido de calentamiento antes de retomar donde estabas.`,
  pause_medium:
    'Llevas unos días fuera. Antes de avanzar, hagamos un repaso rápido de lo último que trabajamos — los conceptos se activan mejor cuando los revisamos al volver.',
  pause_long: `Bienvenido de vuelta después de ${STREAK_DAYS_TOKEN} días. Es normal necesitar un momento para retomar el ritmo. Empecemos desde el último punto de control — sin prisa.`,
};
