import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalibration } from './useCalibration';
import { CALIBRATION_QUESTIONS } from '../lib/calibration-questions';

beforeEach(() => localStorage.clear());

describe('useCalibration (máquina de estados, AC#1)', () => {
  it('start arranca en running con la primera pregunta', () => {
    const { result } = renderHook(() => useCalibration());
    expect(result.current.phase).toBe('idle');
    act(() => result.current.start());
    expect(result.current.phase).toBe('running');
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.total).toBe(6);
    expect(result.current.currentQuestion?.id).toBe(CALIBRATION_QUESTIONS[0].id);
  });

  it('responder avanza el índice y acumula la respuesta', () => {
    const { result } = renderHook(() => useCalibration());
    act(() => result.current.start());
    act(() => result.current.answer(CALIBRATION_QUESTIONS[0].correctOptionId));
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.answers).toHaveLength(1);
    expect(result.current.currentQuestion?.id).toBe(CALIBRATION_QUESTIONS[1].id);
  });

  it('tras 6 respuestas pasa a complete con el puntaje calculado', () => {
    const { result } = renderHook(() => useCalibration());
    act(() => result.current.start());
    for (const q of CALIBRATION_QUESTIONS) {
      act(() => result.current.answer(q.correctOptionId));
    }
    expect(result.current.phase).toBe('complete');
    expect(result.current.score?.score).toBe(6);
    expect(result.current.score?.total).toBe(6);
    // Respuestas instantáneas (test) → promedio < 4 s → anti-tap fuerza Principiante.
    expect(result.current.score?.forcedBeginner).toBe(true);
    expect(result.current.score?.learningPath).toBe('beginner');
    expect(result.current.currentQuestion).toBeNull();
  });

  it('finalize offline persiste el CalibrationResult en el almacén del canal', async () => {
    const { result } = renderHook(() => useCalibration());
    act(() => result.current.start());
    for (const q of CALIBRATION_QUESTIONS) {
      act(() => result.current.answer(q.correctOptionId));
    }
    await act(async () => {
      await result.current.finalize('user-1');
    });
    const raw = localStorage.getItem('egc_calibration_result');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.userId).toBe('user-1');
    expect(parsed.recommendedStartLevel).toBe(1);
  });
});
