import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import axe, { type RunOptions } from 'axe-core';
import { CalibrationQuestion } from './CalibrationQuestion';
import { CALIBRATION_QUESTIONS } from '../../lib/calibration-questions';
import { pickText } from '../../i18n/pickText';

const AXE_OPTIONS: RunOptions = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  rules: { 'color-contrast': { enabled: false } },
};

const Q = CALIBRATION_QUESTIONS[0];

describe('CalibrationQuestion', () => {
  it('renderiza el enunciado y las 4 opciones', () => {
    render(<CalibrationQuestion question={Q} onAnswer={() => {}} currentIndex={0} total={6} />);
    expect(screen.getByText(pickText(Q.prompt, 'es'))).toBeInTheDocument();
    for (const option of Q.options) {
      expect(screen.getByText(pickText(option.text, 'es'))).toBeInTheDocument();
    }
    // 4 opciones (Button) + el botón Siguiente.
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByText('Pregunta 1 de 6')).toBeInTheDocument();
  });

  it('Siguiente está deshabilitado hasta seleccionar y al pulsarlo llama onAnswer con el id', () => {
    const onAnswer = vi.fn();
    render(<CalibrationQuestion question={Q} onAnswer={onAnswer} currentIndex={0} total={6} />);
    const next = screen.getByRole('button', { name: 'Siguiente' });
    expect(next).toBeDisabled();

    // Selecciona la opción correcta (B).
    fireEvent.click(screen.getByText(pickText(Q.options[1].text, 'es')));
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(Q.correctOptionId);
  });

  it('en la última pregunta el botón dice Finalizar', () => {
    render(<CalibrationQuestion question={Q} onAnswer={() => {}} currentIndex={5} total={6} />);
    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad (axe wcag2 a/aa)', async () => {
    const { container } = render(
      <CalibrationQuestion question={Q} onAnswer={() => {}} currentIndex={0} total={6} />
    );
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
