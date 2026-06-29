// PolicyModuleComplete — pantalla final 9/9 del módulo "Políticas de Red" (EGC-18).
//
// Espejo de NatModuleComplete: resumen + Badge success + navegación al inicio + reinicio. Dispara
// la intervención `module_complete` una sola vez al montar con POLICY_INTERVENTIONS. Como la bible
// §4.5 aún NO tiene línea verbatim "Políticas de Red", POLICY_INTERVENTIONS.module_complete está
// vacío y la burbuja degrada en silencio (useAvatarInterventions hace `?? null` y AvatarIntervention
// no renderiza con message vacío), exactamente como shipearon EGC-11/EGC-12 a la espera de UXW.

import { useEffect } from 'react';
import { Badge, Button, Card } from '../../ui';
import { useAvatarInterventions } from '../../../hooks/useAvatarInterventions';
import { POLICY_INTERVENTIONS } from '../../../lib/avatar-copy';
import { AvatarIntervention } from '../../avatar/AvatarIntervention';
import { navigateTo } from '../../../hooks/useHashRoute.js';

export interface PolicyModuleCompleteProps {
  onRestart: () => void;
  total?: number;
}

export function PolicyModuleComplete({ onRestart, total = 9 }: PolicyModuleCompleteProps) {
  const { currentMessage, isVisible, triggerIntervention, dismiss } = useAvatarInterventions(
    undefined,
    POLICY_INTERVENTIONS
  );

  // triggerIntervention es estable (useCallback): dispara una sola vez al montar.
  useEffect(() => {
    triggerIntervention('module_complete');
  }, [triggerIntervention]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="flex flex-col items-start gap-3" aria-label="Módulo Políticas de Red completado">
        <Badge variant="success">Módulo completado</Badge>
        <h2 className="text-mobile-xl font-bold text-neutral-900">Completaste Políticas de Red</h2>
        <p className="text-mobile-sm text-neutral-700">
          Resolviste los {total} escenarios reconociendo el shadowing y ordenando las reglas para que
          cada una se pueda alcanzar.
        </p>
        <Button variant="primary" size="lg" className="w-full" onClick={() => navigateTo('home')}>
          Volver al inicio
        </Button>
        <Button variant="secondary" size="lg" className="w-full" onClick={onRestart}>
          Reiniciar módulo
        </Button>
      </Card>
      <AvatarIntervention message={currentMessage} isVisible={isVisible} onDismiss={dismiss} />
    </div>
  );
}

export default PolicyModuleComplete;
