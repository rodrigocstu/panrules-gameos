import { describe, it, expect } from 'vitest';
import type { CalibrationAnswer } from '../types/domain';
import { CALIBRATION_QUESTIONS } from './calibration-questions';
import { scoreCalibration, isAnswerCorrect, START_LEVEL } from './calibration-scoring';

// Construye respuestas: las primeras `correctCount` correctas, el resto incorrectas,
// con `timeMs` de tiempo por pregunta (controla el anti-tap).
function makeAnswers(correctCount: number, timeMs: number): CalibrationAnswer[] {
  return CALIBRATION_QUESTIONS.map((q, i) => {
    const wrong = q.options.find((o) => o.id !== q.correctOptionId)!.id;
    return {
      questionId: q.id,
      selectedOptionId: i < correctCount ? q.correctOptionId : wrong,
      timeSpentMs: timeMs,
    };
  });
}

describe('scoreCalibration — bifurcación (calibration-test-design §1)', () => {
  it('6/6 con tiempo ≥ 4 s → Intermedio (L11)', () => {
    const r = scoreCalibration(makeAnswers(6, 5000));
    expect(r.score).toBe(6);
    expect(r.forcedBeginner).toBe(false);
    expect(r.learningPath).toBe('intermediate');
    expect(r.recommendedStartLevel).toBe(START_LEVEL.intermediate);
    expect(r.recommendedStartLevel).toBe(11);
  });

  it('4/6 con tiempo ≥ 4 s → Intermedio (umbral inclusivo ≥ 4)', () => {
    const r = scoreCalibration(makeAnswers(4, 8000));
    expect(r.score).toBe(4);
    expect(r.learningPath).toBe('intermediate');
  });

  it('3/6 con tiempo ≥ 4 s → Principiante (L1, umbral es ≥ 4 no ≥ 3)', () => {
    const r = scoreCalibration(makeAnswers(3, 8000));
    expect(r.score).toBe(3);
    expect(r.forcedBeginner).toBe(false);
    expect(r.learningPath).toBe('beginner');
    expect(r.recommendedStartLevel).toBe(1);
  });

  it('anti-tap: 6/6 pero tiempo < 4 s → fuerza Principiante (L1)', () => {
    const r = scoreCalibration(makeAnswers(6, 1000));
    expect(r.score).toBe(6);
    expect(r.forcedBeginner).toBe(true);
    expect(r.learningPath).toBe('beginner');
    expect(r.recommendedStartLevel).toBe(1);
  });

  it('topicScores cae a 0–1 por tema (todas correctas → todos en 1)', () => {
    const r = scoreCalibration(makeAnswers(6, 5000));
    for (const value of Object.values(r.topicScores)) {
      expect(value).toBe(1);
    }
    expect(r.topicScores.zones).toBe(1);
    expect(r.topicScores['nat-type']).toBe(1);
  });

  it('todas incorrectas → score 0 y topicScores en 0', () => {
    const r = scoreCalibration(makeAnswers(0, 5000));
    expect(r.score).toBe(0);
    expect(r.learningPath).toBe('beginner');
    expect(r.topicScores['security-profiles']).toBe(0);
  });
});

describe('isAnswerCorrect', () => {
  it('valida la opción correcta de Q1 (B)', () => {
    expect(isAnswerCorrect('q1', 'B')).toBe(true);
    expect(isAnswerCorrect('q1', 'A')).toBe(false);
  });

  it('una pregunta inexistente nunca es correcta', () => {
    expect(isAnswerCorrect('nope', 'A')).toBe(false);
  });
});
