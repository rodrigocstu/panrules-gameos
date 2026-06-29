// ModuleComplete — pantalla final 9/9 del módulo Firewall (EGC-11).
//
// Resumen + Badge success + teaser del Sprint 3 ("La Centralita") + botón para reiniciar.
// Dispara la intervención `module_complete` (§4.5 "El Portero") una sola vez al montar,
// con su propia instancia del avatar (FirewallLevel ya se desmontó al pasar a 'complete').

import { useEffect } from 'react';
import { Badge, Button, Card } from '../../ui';
import { useAvatarInterventions } from '../../../hooks/useAvatarInterventions';
import { AvatarIntervention } from '../../avatar/AvatarIntervention';
import { navigateTo } from '../../../hooks/useHashRoute.js';

export interface ModuleCompleteProps {
  onRestart: () => void;
  total?: number;
}

export function ModuleComplete({ onRestart, total = 9 }: ModuleCompleteProps) {
  const { currentMessage, isVisible, triggerIntervention, dismiss } = useAvatarInterventions();

  // triggerIntervention es estable (useCallback): dispara una sola vez al montar.
  useEffect(() => {
    triggerIntervention('module_complete');
  }, [triggerIntervention]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="flex flex-col items-start gap-3" aria-label="Módulo Firewall completado">
        <Badge variant="success">Módulo completado</Badge>
        <h2 className="text-mobile-xl font-bold text-neutral-900">Completaste El Portero</h2>
        <p className="text-mobile-sm text-neutral-700">
          Configuraste los {total} escenarios del módulo Firewall de principio a fin.
        </p>
        <div className="w-full rounded-lg bg-primary/5 p-3">
          <p className="text-mobile-sm font-semibold text-primary-dark">
            Siguiente módulo: La Centralita
          </p>
          <p className="text-mobile-xs text-neutral-600">
            SNAT, DNAT y el U-Turn que más confunde a todos.
          </p>
          <Button
            variant="primary"
            size="md"
            className="mt-2 w-full"
            onClick={() => navigateTo('nat')}
          >
            Entrar a La Centralita
          </Button>
        </div>
        <Button variant="secondary" size="lg" className="w-full" onClick={onRestart}>
          Reiniciar módulo
        </Button>
      </Card>
      <AvatarIntervention message={currentMessage} isVisible={isVisible} onDismiss={dismiss} />
    </div>
  );
}

export default ModuleComplete;
