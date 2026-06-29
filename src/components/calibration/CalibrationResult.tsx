// CalibrationResult — pantalla de bifurcación (EGC-10, AC#1).
//
// Variantes de `docs/calibration-test-design.md` §3 P5: Principiante (Badge success, L1),
// Intermedio (Badge primary, L11) y anti-tap (texto explicativo de respuesta rápida). El
// CTA "Empezar Nivel X" delega la navegación al padre (OnboardingFlow → home).
import type { CalibrationScore } from '../../lib/calibration-scoring';
import { Button, Card, Badge } from '../ui';

export interface CalibrationResultProps {
  score: CalibrationScore;
  /** Inicia el learning path (el padre navega a home). */
  onStart: () => void;
}

export function CalibrationResult({ score, onStart }: CalibrationResultProps) {
  const intermediate = score.learningPath === 'intermediate';
  const title = intermediate
    ? 'Tu punto de partida: NGFW Engineer'
    : 'Tu punto de partida: Fundamentos PAN-OS';

  let description: string;
  if (score.forcedBeginner) {
    description =
      'Parece que respondiste muy rápido. Te asignamos el nivel base para que explores sin presión. Puedes recalibrar desde tu perfil cuando quieras.';
  } else if (intermediate) {
    description =
      'Tienes una base sólida. Empezarás desde el Nivel 11 para profundizar en policy-order, perfiles avanzados y más.';
  } else {
    description =
      'Empezarás desde el Nivel 1 para construir una base sólida en zonas, App-ID y NAT.';
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 flex flex-col gap-4">
      <Card aria-label="Resultado de la calibración" className="flex flex-col items-start gap-3">
        <Badge variant={intermediate ? 'primary' : 'success'}>
          {intermediate ? 'Intermedio' : 'Principiante'}
        </Badge>
        <h1 className="text-mobile-xl font-bold text-neutral-900">{title}</h1>
        <p className="text-mobile-sm text-neutral-600">{description}</p>

        <dl className="w-full mt-2 flex flex-col gap-2 text-mobile-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Aciertos</dt>
            <dd className="font-semibold tabular-nums">
              {score.score}/{score.total}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Nivel de inicio</dt>
            <dd className="font-semibold tabular-nums">L{score.recommendedStartLevel}</dd>
          </div>
        </dl>
      </Card>

      <Button className="w-full" onClick={onStart}>
        Empezar Nivel {score.recommendedStartLevel} — ¡Adelante!
      </Button>
    </div>
  );
}

export default CalibrationResult;
