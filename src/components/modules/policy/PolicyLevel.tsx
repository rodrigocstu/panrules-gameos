// PolicyLevel — compone la pantalla de un nivel del módulo "Políticas de Red" (EGC-18).
//
// Espejo de NatLevel/FirewallLevel: cabecera + TrafficVisualizer (reusado tal cual), el editor de
// reglas ordenadas (PolicyListEditorMobile), el aviso de shadowing (ShadowBanner, alimentado por
// el detectShadowing en vivo del hook) y la burbuja AvatarIntervention con POLICY_INTERVENTIONS.
// Un badge de cabecera comunica el objetivo del módulo ("Orden de reglas"). La progresión la
// decide isWin (invariante #1): una solución DENY correcta se ve "blocked" pero avanza igual.

import { ZONES } from '../../../data/constants';
import { pickText } from '../../../i18n/pickText';
import type { ZoneId } from '../../../types/domain';
import { useAvatarInterventions } from '../../../hooks/useAvatarInterventions';
import { POLICY_INTERVENTIONS } from '../../../lib/avatar-copy';
import type { UsePolicyModule } from '../../../hooks/usePolicyModule';
import { Badge } from '../../ui';
import { AvatarIntervention } from '../../avatar/AvatarIntervention';
import { LevelComplete } from '../firewall/LevelComplete';
import { PolicyListEditorMobile } from './PolicyListEditorMobile';
import { ShadowBanner } from './ShadowBanner';
import { TrafficVisualizer, type TrafficStatus } from '../firewall/TrafficVisualizer';

export interface PolicyLevelProps {
  policy: UsePolicyModule;
}

function trafficStatus(
  phase: UsePolicyModule['phase'],
  result: UsePolicyModule['result']
): TrafficStatus {
  // El visualizer refleja finalAction: un acierto que BLOQUEA (solución DENY) se ve "blocked"
  // aunque el nivel avance — la progresión la decide isWin (invariante #1), igual que NatLevel.
  if (phase === 'correct') return result?.finalAction === 'drop' ? 'blocked' : 'allowed';
  if (phase === 'failed') return 'blocked';
  return 'idle';
}

export function PolicyLevel({ policy }: PolicyLevelProps) {
  const { level, rules, shadowReports, phase, attemptCount, result, levelNumber, total } = policy;
  const avatar = useAvatarInterventions(undefined, POLICY_INTERVENTIONS);

  const handleSubmit = (): void => {
    const thisAttempt = attemptCount + 1;
    const verdict = policy.submitAnswer();
    if (verdict.isWin) {
      avatar.onCorrect(thisAttempt);
    } else {
      avatar.onWrongAttempt(thisAttempt, verdict, level);
    }
  };

  // Etiqueta legible de cada regla por su posición actual en la lista ordenada.
  const ruleLabel = (id: string): string => {
    const idx = rules.findIndex((r) => r.id === id);
    return idx >= 0 ? `Regla ${idx + 1}` : id;
  };

  const solved = phase === 'correct';

  return (
    <section className="flex flex-col gap-4" aria-label={`Nivel ${levelNumber} de ${total}`}>
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-mobile-xs font-semibold uppercase tracking-wide text-primary">
            Nivel {levelNumber} / {total}
          </span>
          <Badge variant="primary">Orden de reglas</Badge>
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
        <LevelComplete level={level} isLastLevel={levelNumber === total} onNext={policy.nextLevel} />
      ) : (
        <>
          <ShadowBanner shadowReports={shadowReports} ruleLabel={ruleLabel} />
          <PolicyListEditorMobile
            rules={rules}
            shadowReports={shadowReports}
            onMoveUp={policy.moveRuleUp}
            onMoveDown={policy.moveRuleDown}
            onToggleDisabled={policy.toggleRuleDisabled}
            onSetField={policy.setRuleField}
            onSubmit={handleSubmit}
          />
        </>
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

export default PolicyLevel;
