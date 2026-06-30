// CalibrationQuestion — template reutilizable de pregunta (EGC-10, AC#1).
//
// Renderiza el enunciado en una Card, 4 opciones como Button (secondary; la seleccionada
// pasa a primary) y un botón "Siguiente/Finalizar" deshabilitado hasta que hay selección
// (UX de `docs/calibration-test-design.md` §3 P3: sin temporizador visible, ≥44px de área
// táctil, una sola opción activa). La barra de progreso muestra "Pregunta N de 6".
import { useEffect, useState } from 'react';
import type { CalibrationQuestion as Question } from '../../types/domain';
import { pickText } from '../../i18n/pickText';
import { Button, Card, ProgressBar } from '../ui';

export interface CalibrationQuestionProps {
  question: Question;
  /** Llamado con el id de opción elegida al pulsar Siguiente/Finalizar. */
  onAnswer: (selectedOptionId: string) => void;
  /** Índice 0-based de la pregunta actual. */
  currentIndex: number;
  total: number;
}

export function CalibrationQuestion({
  question,
  onAnswer,
  currentIndex,
  total,
}: CalibrationQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const number = currentIndex + 1;
  const isLast = number >= total;
  const promptId = `calibration-q-${question.id}`;

  // Reinicia la selección cuando cambia la pregunta.
  useEffect(() => {
    setSelected(null);
  }, [question.id]);

  return (
    <div className="max-w-sm mx-auto px-4 py-6 flex flex-col gap-4">
      <div>
        <ProgressBar
          value={number}
          max={total}
          label={`Progreso de la calibración: pregunta ${number} de ${total}`}
        />
        <p className="mt-2 text-mobile-sm text-neutral-500" aria-live="polite">
          Pregunta {number} de {total}
        </p>
      </div>

      <Card aria-label={`Pregunta ${number}`}>
        <h2 id={promptId} className="text-mobile-lg font-semibold text-neutral-900">
          {pickText(question.prompt, 'es')}
        </h2>
      </Card>

      <div role="group" aria-labelledby={promptId} className="flex flex-col gap-2">
        {question.options.map((option) => {
          const active = selected === option.id;
          return (
            <Button
              key={option.id}
              variant={active ? 'primary' : 'secondary'}
              aria-pressed={active}
              onClick={() => setSelected(option.id)}
              className="!justify-start text-left"
            >
              <span className="font-bold mr-2" aria-hidden="true">
                {option.id}.
              </span>
              <span>{pickText(option.text, 'es')}</span>
            </Button>
          );
        })}
      </div>

      <Button
        className="w-full"
        disabled={selected === null}
        onClick={() => {
          if (selected !== null) onAnswer(selected);
        }}
      >
        {isLast ? 'Finalizar' : 'Siguiente'}
      </Button>
    </div>
  );
}

export default CalibrationQuestion;
