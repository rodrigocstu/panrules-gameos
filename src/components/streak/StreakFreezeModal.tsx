// StreakFreezeModal — UI de Streak-Freeze (EGC-12, satisface "StreakFreezeUI" de AC#3).
//
// Muestra los freezeTokens restantes y permite consumir uno para proteger una racha rota.
// A11y: reutiliza useModalA11y (trap de foco + Esc + restauración) en vez de reinventarlo;
// role="dialog" + aria-modal + aria-labelledby/-describedby. Copy "mentor sin culpa": nunca
// "rompiste tu racha", sin reproche por el día perdido (regla UX del proyecto).

import { useId } from 'react';
import { Flame } from 'lucide-react';
import { Badge, Button, Card } from '../ui';
import { useModalA11y } from '../../hooks/useModalA11y.js';

export interface StreakFreezeModalProps {
  freezeTokens: number;
  onUseFreeze: () => void;
  onDismiss: () => void;
}

export function StreakFreezeModal({ freezeTokens, onUseFreeze, onDismiss }: StreakFreezeModalProps) {
  const { containerRef } = useModalA11y(true, onDismiss);
  const titleId = useId();
  const descId = useId();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/40 px-4 pb-6 pt-20 sm:items-center"
      data-testid="streak-freeze-overlay"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-sm"
      >
        <Card className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Flame size={28} className="text-accent" aria-hidden="true" />
          </span>
          <h2 id={titleId} className="text-mobile-xl font-bold text-neutral-900">
            Protege tu racha
          </h2>
          <Badge variant="warning">
            {freezeTokens} {freezeTokens === 1 ? 'Freeze disponible' : 'Freezes disponibles'}
          </Badge>
          <p id={descId} className="text-mobile-sm leading-relaxed text-neutral-700">
            Pasó un día sin práctica — no pasa nada. Usa un Freeze para mantener tu racha viva y
            retomar justo donde lo dejaste.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onUseFreeze}
            disabled={freezeTokens <= 0}
          >
            Usar Freeze
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={onDismiss}>
            No, gracias
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default StreakFreezeModal;
