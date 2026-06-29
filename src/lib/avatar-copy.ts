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
