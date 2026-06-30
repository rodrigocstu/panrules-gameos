// NatLevel — compone la pantalla de un nivel del módulo NAT "La Centralita" (EGC-12).
//
// Espejo de FirewallLevel: cabecera, TrafficVisualizer (reutilizado tal cual), NatEditorMobile
// y la burbuja AvatarIntervention. Diferencias: el avatar usa NAT_INTERVENTIONS (su línea de
// module_complete es específica de La Centralita) y un badge "NAT" muestra level.solution.nat
// para enfocar al aprendiz en el tipo de traducción del escenario.

import { ZONES } from '../../../data/constants';
import { pickText } from '../../../i18n/pickText';
import type { ZoneId } from '../../../types/domain';
import { useAvatarInterventions } from '../../../hooks/useAvatarInterventions';
import { NAT_INTERVENTIONS } from '../../../lib/avatar-copy';
import type { UseNatModule } from '../../../hooks/useNatModule';
import { Badge } from '../../ui';
import { AvatarIntervention } from '../../avatar/AvatarIntervention';
import { LevelComplete } from '../firewall/LevelComplete';
import { NatEditorMobile } from './NatEditorMobile';
import { TrafficVisualizer, type TrafficStatus } from '../firewall/TrafficVisualizer';

export interface NatLevelProps {
  nat: UseNatModule;
}

function trafficStatus(
  phase: UseNatModule['phase'],
  result: UseNatModule['result']
): TrafficStatus {
  // El visualizer refleja finalAction: un acierto que BLOQUEA se ve "blocked" aunque el nivel
  // avance — la progresión la decide isWin (invariante #1), idéntico a FirewallLevel.
  if (phase === 'correct') return result?.finalAction === 'drop' ? 'blocked' : 'allowed';
  if (phase === 'failed') return 'blocked';
  return 'idle';
}

export function NatLevel({ nat }: NatLevelProps) {
  const { level, config, phase, attemptCount, result, levelNumber, total } = nat;
  const avatar = useAvatarInterventions(undefined, NAT_INTERVENTIONS);

  const handleSubmit = (): void => {
    const thisAttempt = attemptCount + 1;
    const verdict = nat.submitAnswer();
    if (verdict.isWin) {
      avatar.onCorrect(thisAttempt);
    } else {
      avatar.onWrongAttempt(thisAttempt, verdict, level);
    }
  };

  const solved = phase === 'correct';

  return (
    <section className="flex flex-col gap-4" aria-label={`Nivel ${levelNumber} de ${total}`}>
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-mobile-xs font-semibold uppercase tracking-wide text-primary">
            Nivel {levelNumber} / {total}
          </span>
          <Badge variant="primary">NAT: {level.solution.nat}</Badge>
        </div>
        <h1 className="text-mobile-lg font-bold text-neutral-900">{pickText(level.title, 'es')}</h1>
        <p className="text-mobile-sm text-neutral-600">{pickText(level.desc, 'es')}</p>
      </header>

      <TrafficVisualizer
        srcZoneLabel={zoneLabel(level.packet.srcZone)}
        dstZoneLabel={zoneLabel(level.packet.dstZone)}
        status={trafficStatus(phase, result)}
      />

      {solved ? (
        <LevelComplete level={level} isLastLevel={levelNumber === total} onNext={nat.nextLevel} />
      ) : (
        <NatEditorMobile
          level={level}
          config={config}
          onChange={nat.setField}
          onSubmit={handleSubmit}
        />
      )}

      <AvatarIntervention
        message={avatar.currentMessage}
        isVisible={avatar.isVisible}
        onDismiss={avatar.dismiss}
      />
    </section>
  );
}

function zoneLabel(id: ZoneId): string {
  return ZONES[id].label;
}

export default NatLevel;
