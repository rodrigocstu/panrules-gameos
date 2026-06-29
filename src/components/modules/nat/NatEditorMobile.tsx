// NatEditorMobile — editor de política del módulo NAT "La Centralita" (EGC-12).
//
// Espejo de PolicyEditorMobile (los mismos 7 PolicyField + Commit), con dos diferencias
// pedagógicas: (1) un diagrama NAT compacto de 3 líneas que lee level.nat (NatData) —las IPs
// provienen del dato del nivel, NO se inventan—, y (2) acento visual sobre el campo NAT, foco
// del módulo. Reutiliza PolicyField y las opciones compartidas (policyFieldOptions).

import { Badge, Button, Card } from '../../ui';
import { pickText } from '../../../i18n/pickText';
import { APPS, PROFILES, SERVICES } from '../../../data/constants';
import type { Level, PolicyConfig } from '../../../types/domain';
import type { PolicyEditableField } from '../../../hooks/useFirewallModule';
import { PolicyField } from '../firewall/PolicyField';
import { ZONE_OPTIONS, ACTION_OPTIONS, NAT_OPTIONS } from '../policyFieldOptions';

export interface NatEditorMobileProps {
  level: Level;
  config: PolicyConfig;
  onChange: (field: PolicyEditableField, value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

// Diagrama NAT (role="img" como TrafficVisualizer: una imagen accesible con etiqueta-resumen).
function NatDiagram({ level }: { level: Level }) {
  const { type, source, destination, packetLabel } = level.nat;
  const summary = `Contexto NAT ${type}. Origen ${source.original} a ${source.translated}. Destino ${destination.original} a ${destination.translated}. ${packetLabel}.`;
  return (
    <div
      role="img"
      aria-label={summary}
      data-testid="nat-context"
      className="rounded-lg border border-primary/40 bg-primary/5 p-3"
    >
      <div aria-hidden="true" className="mb-1.5 flex items-center justify-between">
        <span className="text-mobile-xs font-semibold uppercase tracking-wide text-primary-dark">
          Contexto NAT
        </span>
        <Badge variant="primary">{type}</Badge>
      </div>
      <dl aria-hidden="true" className="flex flex-col gap-0.5 text-mobile-xs text-neutral-700">
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-500">Origen (SNAT)</dt>
          <dd className="font-medium tabular-nums">
            {source.original} → {source.translated}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-500">Destino (DNAT)</dt>
          <dd className="font-medium tabular-nums">
            {destination.original} → {destination.translated}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-500">Paquete</dt>
          <dd className="font-medium">{packetLabel}</dd>
        </div>
      </dl>
    </div>
  );
}

export function NatEditorMobile({
  level,
  config,
  onChange,
  onSubmit,
  disabled = false,
}: NatEditorMobileProps) {
  return (
    <Card className="flex flex-col gap-4" aria-label={`Editor de NAT: ${pickText(level.title, 'es')}`}>
      <NatDiagram level={level} />
      <PolicyField
        label="Source Zone"
        value={config.srcZone}
        options={ZONE_OPTIONS}
        onChange={(v) => onChange('srcZone', v)}
        disabled={disabled}
      />
      <PolicyField
        label="Destination Zone"
        value={config.dstZone}
        options={ZONE_OPTIONS}
        onChange={(v) => onChange('dstZone', v)}
        disabled={disabled}
      />
      <PolicyField
        label="Application (App-ID)"
        value={config.app}
        options={APPS}
        onChange={(v) => onChange('app', v)}
        disabled={disabled}
      />
      <PolicyField
        label="Service"
        value={config.service}
        options={SERVICES}
        onChange={(v) => onChange('service', v)}
        disabled={disabled}
      />
      <PolicyField
        label="Action"
        value={config.action}
        options={ACTION_OPTIONS}
        onChange={(v) => onChange('action', v)}
        disabled={disabled}
      />
      {/* Campo NAT con acento visual: es el foco pedagógico del módulo La Centralita. */}
      <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-2" data-testid="nat-field-emphasis">
        <PolicyField
          label="NAT"
          value={config.nat}
          options={NAT_OPTIONS}
          onChange={(v) => onChange('nat', v)}
          disabled={disabled}
        />
      </div>
      <PolicyField
        label="Security Profile"
        value={config.profile}
        options={PROFILES}
        onChange={(v) => onChange('profile', v)}
        disabled={disabled}
      />
      <Button variant="primary" size="lg" className="w-full" onClick={onSubmit} disabled={disabled}>
        Commit
      </Button>
    </Card>
  );
}

export default NatEditorMobile;
