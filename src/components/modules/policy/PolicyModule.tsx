// PolicyModule — orquestador del módulo "Políticas de Red" (orden y shadowing, EGC-18).
//
// Espejo de NatModule/FirewallModule: posee el estado (usePolicyModule) y conmuta entre el nivel
// activo y la pantalla final, con el indicador de progreso N/9. NO renderiza StreakCounter:
// AppShell ya lo monta en el header; el módulo solo aporta el progreso de nivel.

import { ProgressBar } from '../../ui';
import { usePolicyModule } from '../../../hooks/usePolicyModule';
import { PolicyLevel } from './PolicyLevel';
import { PolicyModuleComplete } from './PolicyModuleComplete';

export function PolicyModule() {
  const policy = usePolicyModule();

  if (policy.phase === 'complete') {
    return <PolicyModuleComplete onRestart={policy.resetModule} total={policy.total} />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-mobile-xs font-medium text-neutral-600">
          Nivel {policy.levelNumber} de {policy.total}
        </p>
        <ProgressBar
          value={policy.levelNumber}
          max={policy.total}
          color="primary"
          label={`Progreso del módulo Políticas de Red: nivel ${policy.levelNumber} de ${policy.total}`}
        />
      </div>
      <PolicyLevel policy={policy} />
    </div>
  );
}

export default PolicyModule;
