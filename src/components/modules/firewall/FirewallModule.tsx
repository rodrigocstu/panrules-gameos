// FirewallModule — orquestador del módulo "El Portero" (EGC-11).
//
// Posee el estado del módulo (useFirewallModule) y conmuta entre el nivel activo y la
// pantalla final. Añade el indicador de progreso N/9 con la ProgressBar del Design
// System. NO renderiza StreakCounter: AppShell ya lo monta en el header (cableado a
// useStreak); el módulo sólo aporta el progreso de nivel.

import { ProgressBar } from '../../ui';
import { useFirewallModule } from '../../../hooks/useFirewallModule';
import { FirewallLevel } from './FirewallLevel';
import { ModuleComplete } from './ModuleComplete';

export function FirewallModule() {
  const fw = useFirewallModule();

  if (fw.phase === 'complete') {
    return <ModuleComplete onRestart={fw.resetModule} total={fw.total} />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-mobile-xs font-medium text-neutral-600">
          Nivel {fw.levelNumber} de {fw.total}
        </p>
        <ProgressBar
          value={fw.levelNumber}
          max={fw.total}
          color="primary"
          label={`Progreso del módulo Firewall: nivel ${fw.levelNumber} de ${fw.total}`}
        />
      </div>
      <FirewallLevel fw={fw} />
    </div>
  );
}

export default FirewallModule;
