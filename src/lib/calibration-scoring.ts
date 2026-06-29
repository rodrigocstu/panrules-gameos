// Algoritmo de bifurcación del test de calibración (EGC-10).
//
// Implementa `docs/calibration-test-design.md` §1 al pie de la letra:
//   1. score = nº de respuestas correctas (0–6).
//   2. avgTime (s) = promedio de timeSpentMs / 1000.
//   3. avgTime < 4 s  → Principiante (anti-tap override), sin importar el score.
//   4. avgTime ≥ 4 s y score ≥ 4 → Intermedio.
//   5. en cualquier otro caso → Principiante.
//   6. startLevel: Principiante → L1 (tier F), Intermedio → L11 (tier N).
//
// Función pura, sin React: testeable de forma aislada y reutilizable por
// `useCalibration`. Los tipos provienen de `src/types/domain.ts` (EGC-6).
import type {
  CalibrationAnswer,
  CalibrationQuestion,
  CalibrationTopic,
  LearningPath,
} from '../types/domain';
import { CALIBRATION_QUESTIONS } from './calibration-questions';

/** Tiempo promedio por pregunta por debajo del cual se fuerza Principiante. */
export const ANTI_TAP_MIN_AVG_MS = 4000;
/** Umbral de aciertos (inclusivo) para clasificar como Intermedio. */
export const INTERMEDIATE_THRESHOLD = 4;
/** Nivel de inicio en `src/data/levels.ts` por learning path. */
export const START_LEVEL: Record<'beginner' | 'intermediate', number> = {
  beginner: 1, // tier F — L1 "Acceso seguro a Internet"
  intermediate: 11, // tier N — L11 "First-match"
};

export interface CalibrationScore {
  /** Respuestas correctas (0–total). */
  score: number;
  /** Total de preguntas evaluadas. */
  total: number;
  /** Promedio de tiempo por pregunta, en ms (entero). */
  avgTimeMs: number;
  /** true si el promedio cayó bajo el umbral anti-tap y se forzó Principiante. */
  forcedBeginner: boolean;
  learningPath: LearningPath;
  /** `id` del Level de arranque en `src/data/levels.ts`. */
  recommendedStartLevel: number;
  /** Score 0–1 por tema evaluado. */
  topicScores: Record<CalibrationTopic, number>;
}

function emptyTopicTally(): Record<CalibrationTopic, { correct: number; count: number }> {
  return {
    zones: { correct: 0, count: 0 },
    'app-id': { correct: 0, count: 0 },
    'nat-type': { correct: 0, count: 0 },
    'policy-order': { correct: 0, count: 0 },
    'security-profiles': { correct: 0, count: 0 },
  };
}

/** ¿La opción seleccionada para `questionId` es la correcta? */
export function isAnswerCorrect(
  questionId: string,
  selectedOptionId: string | undefined,
  questions: CalibrationQuestion[] = CALIBRATION_QUESTIONS
): boolean {
  const q = questions.find((item) => item.id === questionId);
  return q != null && selectedOptionId === q.correctOptionId;
}

/**
 * Calcula el resultado de la calibración a partir de las respuestas crudas.
 * No persiste ni navega: sólo deriva score, tiempos, learning path y nivel de inicio.
 */
export function scoreCalibration(
  answers: CalibrationAnswer[],
  questions: CalibrationQuestion[] = CALIBRATION_QUESTIONS
): CalibrationScore {
  const total = questions.length;
  const tally = emptyTopicTally();
  let correct = 0;
  let timeSumMs = 0;

  for (const q of questions) {
    const answer = answers.find((a) => a.questionId === q.id);
    const ok = answer != null && answer.selectedOptionId === q.correctOptionId;
    tally[q.topic].count += 1;
    if (ok) {
      correct += 1;
      tally[q.topic].correct += 1;
    }
    timeSumMs += answer?.timeSpentMs ?? 0;
  }

  const avgTimeMs = total > 0 ? Math.round(timeSumMs / total) : 0;
  const forcedBeginner = avgTimeMs < ANTI_TAP_MIN_AVG_MS;
  const learningPath: LearningPath =
    !forcedBeginner && correct >= INTERMEDIATE_THRESHOLD ? 'intermediate' : 'beginner';
  const recommendedStartLevel =
    learningPath === 'intermediate' ? START_LEVEL.intermediate : START_LEVEL.beginner;

  const topicScores = {} as Record<CalibrationTopic, number>;
  (Object.keys(tally) as CalibrationTopic[]).forEach((topic) => {
    const { correct: c, count: n } = tally[topic];
    topicScores[topic] = n > 0 ? c / n : 0;
  });

  return {
    score: correct,
    total,
    avgTimeMs,
    forcedBeginner,
    learningPath,
    recommendedStartLevel,
    topicScores,
  };
}
