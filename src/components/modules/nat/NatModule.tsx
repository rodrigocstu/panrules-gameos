// NatModule — orquestador del módulo NAT "La Centralita" (EGC-12).
//
// Espejo de FirewallModule: posee el estado (useNatModule) y conmuta entre el nivel activo y
// la pantalla final, con el indicador de progreso N/6. NO renderiza StreakCounter: AppShell ya
// lo monta en el header (cableado a useStreak); el módulo solo aporta el progreso de nivel.

import { ProgressBar } from '../../ui';
import { useNatModule } from '../../../hooks/useNatModule';
import { NatLevel } from './NatLevel';
import { NatModuleComplete } from './NatModuleComplete';

export function NatModule() {
  const nat = useNatModule();

  if (nat.phase === 'complete') {
    return <NatModuleComplete onRestart={nat.resetModule} total={nat.total} />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-mobile-xs font-medium text-neutral-600">
          Nivel {nat.levelNumber} de {nat.total}
        </p>
        <ProgressBar
          value={nat.levelNumber}
          max={nat.total}
          color="primary"
          label={`Progreso del módulo La Centralita: nivel ${nat.levelNumber} de ${nat.total}`}
        />
      </div>
      <NatLevel nat={nat} />
    </div>
  );
}

export default NatModule;
