import { describe, it, expect } from 'vitest';
import { CALIBRATION_QUESTIONS, CALIBRATION_TOTAL } from './calibration-questions';

describe('CALIBRATION_QUESTIONS (banco verbatim EGC-3)', () => {
  it('tiene exactamente 6 preguntas', () => {
    expect(CALIBRATION_QUESTIONS).toHaveLength(6);
    expect(CALIBRATION_TOTAL).toBe(6);
  });

  it('cada pregunta tiene 4 opciones con ids únicos', () => {
    for (const q of CALIBRATION_QUESTIONS) {
      expect(q.options).toHaveLength(4);
      const optionIds = q.options.map((o) => o.id);
      expect(new Set(optionIds).size).toBe(4);
    }
  });

  it('cada pregunta tiene exactamente una opción correcta válida', () => {
    for (const q of CALIBRATION_QUESTIONS) {
      const optionIds = q.options.map((o) => o.id);
      expect(optionIds).toContain(q.correctOptionId);
      expect(optionIds.filter((id) => id === q.correctOptionId)).toHaveLength(1);
    }
  });

  it('los ids de pregunta son únicos', () => {
    const ids = CALIBRATION_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cubre los 5 temas del modelo de calibración (EGC-6)', () => {
    const topics = new Set(CALIBRATION_QUESTIONS.map((q) => q.topic));
    expect(topics).toEqual(
      new Set(['zones', 'app-id', 'policy-order', 'nat-type', 'security-profiles'])
    );
  });
});
