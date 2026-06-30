// LevelComplete — pantalla de acierto de un nivel (EGC-11).
//
// Card + Badge (success) + microlección + botón "Siguiente". Muestra
// `pickText(level.explanation, 'es')`: en levels.ts `explanation` es el texto del
// resultado (el "por qué" post-commit), mientras que `hint` es la pista durante la
// configuración — por eso aquí se usa explanation.

import { Badge, Button, Card } from '../../ui';
import { pickText } from '../../../i18n/pickText';
import type { Level } from '../../../types/domain';

export interface LevelCompleteProps {
  level: Level;
  isLastLevel?: boolean;
  onNext: () => void;
}

export function LevelComplete({ level, isLastLevel = false, onNext }: LevelCompleteProps) {
  return (
    <Card className="flex flex-col gap-3" aria-label="Nivel completado">
      <Badge variant="success">Nivel completado</Badge>
      <h2 className="text-mobile-lg font-bold text-neutral-900">{pickText(level.title, 'es')}</h2>
      <p className="text-mobile-sm leading-relaxed text-neutral-700">
        {pickText(level.explanation, 'es')}
      </p>
      <Button variant="primary" size="lg" className="w-full" onClick={onNext}>
        {isLastLevel ? 'Finalizar módulo' : 'Siguiente nivel'}
      </Button>
    </Card>
  );
}

export default LevelComplete;
