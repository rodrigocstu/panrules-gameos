// NatModuleComplete — pantalla final 6/6 del módulo NAT "La Centralita" (EGC-12).
//
// Espejo de ModuleComplete (Firewall): resumen + Badge success + teaser del Sprint 4
// ("Políticas de Red") + navegación al inicio. Dispara la intervención `module_complete`
// (§4.5 "La Centralita", verbatim) una sola vez al montar con NAT_INTERVENTIONS; degrada sin
// burbuja si el array estuviera vacío (el hook hace `?? null`).

import { useEffect } from 'react';
import { Badge, Button, Card } from '../../ui';
import { useAvatarInterventions } from '../../../hooks/useAvatarInterventions';
import { NAT_INTERVENTIONS } from '../../../lib/avatar-copy';
import { AvatarIntervention } from '../../avatar/AvatarIntervention';
import { navigateTo } from '../../../hooks/useHashRoute.js';

export interface NatModuleCompleteProps {
  onRestart: () => void;
  total?: number;
}

export function NatModuleComplete({ onRestart, total = 6 }: NatModuleCompleteProps) {
  const { currentMessage, isVisible, triggerIntervention, dismiss } = useAvatarInterventions(
    undefined,
    NAT_INTERVENTIONS
  );

  // triggerIntervention es estable (useCallback): dispara una sola vez al montar.
  useEffect(() => {
    triggerIntervention('module_complete');
  }, [triggerIntervention]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="flex flex-col items-start gap-3" aria-label="Módulo La Centralita completado">
        <Badge variant="success">Módulo completado</Badge>
        <h2 className="text-mobile-xl font-bold text-neutral-900">Completaste La Centralita</h2>
        <p className="text-mobile-sm text-neutral-700">
          Resolviste los {total} escenarios de SNAT, DNAT y el U-Turn de principio a fin.
        </p>
        <div className="w-full rounded-lg bg-primary/5 p-3">
          <p className="text-mobile-sm font-semibold text-primary-dark">
            Próximamente: Políticas de Red (Sprint 4)
          </p>
          <p className="text-mobile-xs text-neutral-600">
            Reglas de seguridad encadenadas y el orden que lo decide todo.
          </p>
        </div>
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

export default NatModuleComplete;
