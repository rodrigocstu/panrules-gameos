// FirewallLevel — compone la pantalla de un nivel del módulo (EGC-11).
//
// Cabecera (nº de nivel + descripción), TrafficVisualizer, PolicyEditorMobile y la
// burbuja AvatarIntervention. Cablea el estado de useFirewallModule (recibido por props)
// con useAvatarInterventions: en fallo dispara onWrongAttempt(intento, verdict, level);
// en acierto dispara onCorrect(intento) y muestra LevelComplete.

import { ZONES } from '../../../data/constants';
import { pickText } from '../../../i18n/pickText';
import type { ZoneId } from '../../../types/domain';
import { useAvatarInterventions } from '../../../hooks/useAvatarInterventions';
import type { UseFirewallModule } from '../../../hooks/useFirewallModule';
import { AvatarIntervention } from '../../avatar/AvatarIntervention';
import { LevelComplete } from './LevelComplete';
import { PolicyEditorMobile } from './PolicyEditorMobile';
import { TrafficVisualizer, type TrafficStatus } from './TrafficVisualizer';

export interface FirewallLevelProps {
  fw: UseFirewallModule;
}

function trafficStatus(
  phase: UseFirewallModule['phase'],
  result: UseFirewallModule['result']
): TrafficStatus {
  // El visualizer refleja finalAction: un acierto que BLOQUEA (DENY / specialCheck
  // DROPPED) se ve "blocked" aunque el nivel avance — la progresión la decide isWin.
  if (phase === 'correct') return result?.finalAction === 'drop' ? 'blocked' : 'allowed';
  if (phase === 'failed') return 'blocked';
  return 'idle';
}

export function FirewallLevel({ fw }: FirewallLevelProps) {
  const { level, config, phase, attemptCount, result, levelNumber, total } = fw;
  const avatar = useAvatarInterventions();

  const handleSubmit = (): void => {
    const thisAttempt = attemptCount + 1;
    const verdict = fw.submitAnswer();
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
        <span className="text-mobile-xs font-semibold uppercase tracking-wide text-primary">
          Nivel {levelNumber} / {total}
        </span>
        <h1 className="text-mobile-lg font-bold text-neutral-900">{pickText(level.title, 'es')}</h1>
        <p className="text-mobile-sm text-neutral-600">{pickText(level.desc, 'es')}</p>
      </header>

      <TrafficVisualizer
        srcZoneLabel={zoneLabel(level.packet.srcZone)}
        dstZoneLabel={zoneLabel(level.packet.dstZone)}
        status={trafficStatus(phase, result)}
      />

      {solved ? (
        <LevelComplete level={level} isLastLevel={levelNumber === total} onNext={fw.nextLevel} />
      ) : (
        <PolicyEditorMobile
          level={level}
          config={config}
          onChange={fw.setField}
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

export default FirewallLevel;
