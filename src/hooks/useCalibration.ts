// useCalibration — máquina de estados del test de calibración (EGC-10, AC#1).
//
// Presenta las 6 preguntas secuencialmente, mide `timeSpentMs` por pregunta (para el
// anti-tap) y, al terminar, deriva el resultado con `scoreCalibration` (algoritmo puro,
// testeado aparte). `finalize` arma el `CalibrationResult` del dominio EGC-6, lo envía
// al backend cuando hay conexión y, offline, lo cachea en el almacén del canal — el
// flujo nunca se interrumpe por falta de red (offline-first).
//
// Las transiciones se calculan en handlers (fuera de updaters de setState) usando refs
// como fuente de verdad, de modo que el doble render de StrictMode no registra respuestas
// dos veces — mismo principio que el `commit()` de useProgress.
import { useState, useCallback, useRef } from 'react';
import type { CalibrationAnswer, CalibrationQuestion, CalibrationResult } from '../types/domain';
import { CALIBRATION_QUESTIONS, CALIBRATION_TOTAL } from '../lib/calibration-questions';
import { scoreCalibration, type CalibrationScore } from '../lib/calibration-scoring';
import { api, isOffline } from '../services/api';
import { storageSet } from '../lib/tokenStore';

const RESULT_KEY = 'egc_calibration_result';

export type CalibrationPhase = 'idle' | 'running' | 'complete';

export interface UseCalibration {
  phase: CalibrationPhase;
  currentIndex: number;
  total: number;
  currentQuestion: CalibrationQuestion | null;
  answers: CalibrationAnswer[];
  /** Resultado calculado (puntaje, learning path, nivel) — disponible al completar. */
  score: CalibrationScore | null;
  /** Registro persistido/enviado del resultado (forma del dominio EGC-6). */
  result: CalibrationResult | null;
  start: () => void;
  /** Registra la opción elegida para la pregunta actual y avanza. */
  answer: (selectedOptionId: string) => void;
  /** Construye, envía/cachea el CalibrationResult; devuelve el registro. */
  finalize: (userId: string) => Promise<CalibrationResult>;
  reset: () => void;
}

export function useCalibration(
  questions: CalibrationQuestion[] = CALIBRATION_QUESTIONS
): UseCalibration {
  const [phase, setPhase] = useState<CalibrationPhase>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<CalibrationAnswer[]>([]);
  const [score, setScore] = useState<CalibrationScore | null>(null);
  const [result, setResult] = useState<CalibrationResult | null>(null);

  const phaseRef = useRef<CalibrationPhase>('idle');
  const indexRef = useRef(0);
  const answersRef = useRef<CalibrationAnswer[]>([]);
  const questionStartRef = useRef<number>(0);
  const total = questions.length;

  const start = useCallback(() => {
    phaseRef.current = 'running';
    indexRef.current = 0;
    answersRef.current = [];
    questionStartRef.current = Date.now();
    setAnswers([]);
    setScore(null);
    setResult(null);
    setCurrentIndex(0);
    setPhase('running');
  }, []);

  const answer = useCallback(
    (selectedOptionId: string) => {
      if (phaseRef.current !== 'running') return;
      const index = indexRef.current;
      const question = questions[index];
      if (!question) return;

      const entry: CalibrationAnswer = {
        questionId: question.id,
        selectedOptionId,
        timeSpentMs: Math.max(0, Date.now() - questionStartRef.current),
      };
      const nextAnswers = [...answersRef.current, entry];
      answersRef.current = nextAnswers;
      setAnswers(nextAnswers);

      if (index + 1 >= total) {
        indexRef.current = index;
        phaseRef.current = 'complete';
        setScore(scoreCalibration(nextAnswers, questions));
        setPhase('complete');
      } else {
        indexRef.current = index + 1;
        questionStartRef.current = Date.now();
        setCurrentIndex(index + 1);
      }
    },
    [questions, total]
  );

  const finalize = useCallback(
    async (userId: string): Promise<CalibrationResult> => {
      const finalAnswers = answersRef.current;
      const computed = scoreCalibration(finalAnswers, questions);
      const durationMs = finalAnswers.reduce((sum, a) => sum + a.timeSpentMs, 0);
      const record: CalibrationResult = {
        userId,
        completedAt: new Date().toISOString(),
        learningPath: computed.learningPath,
        topicScores: computed.topicScores,
        recommendedStartLevel: computed.recommendedStartLevel,
        durationMs,
      };

      try {
        const res = await api.submitCalibration(finalAnswers);
        if (!isOffline(res)) {
          setResult(res);
          return res;
        }
      } catch {
        // Sin backend o fallo de red: persistimos el resultado localmente (offline-first).
      }
      await storageSet(RESULT_KEY, JSON.stringify(record));
      setResult(record);
      return record;
    },
    [questions]
  );

  const reset = useCallback(() => {
    phaseRef.current = 'idle';
    indexRef.current = 0;
    answersRef.current = [];
    setAnswers([]);
    setScore(null);
    setResult(null);
    setCurrentIndex(0);
    setPhase('idle');
  }, []);

  return {
    phase,
    currentIndex,
    total,
    currentQuestion: phase === 'running' ? (questions[currentIndex] ?? null) : null,
    answers,
    score,
    result,
    start,
    answer,
    finalize,
    reset,
  };
}

export { CALIBRATION_TOTAL };
