// PolicyEditorMobile — editor de política apilado para 375 px (EGC-11, Screen 07).
//
// Reemplaza la tabla `min-w-[600px]` del PolicyEditor de escritorio por los 7 campos
// reales de PolicyConfig en stack vertical (srcZone, dstZone, app, service, action, nat,
// profile). Las opciones de zona/app/service/profile vienen de src/data/constants.ts;
// action y nat NO tienen array de constantes, así que se derivan de los literales del
// dominio en listas locales (no se busca un import inexistente).

import { Button, Card } from '../../ui';
import { pickText } from '../../../i18n/pickText';
import { APPS, PROFILES, SERVICES, ZONES } from '../../../data/constants';
import type { Level, PolicyConfig } from '../../../types/domain';
import type { PolicyEditableField } from '../../../hooks/useFirewallModule';
import { PolicyField, type PolicyFieldOption } from './PolicyField';

export interface PolicyEditorMobileProps {
  level: Level;
  config: PolicyConfig;
  onChange: (field: PolicyEditableField, value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const ZONE_OPTIONS: PolicyFieldOption[] = Object.values(ZONES).map((z) => ({
  id: z.id,
  label: z.label,
}));

// `action` y `nat` se derivan de los literales de dominio (Action / NatType): no existe
// un array de constantes para ellos en constants.ts.
const ACTION_OPTIONS: PolicyFieldOption[] = [
  { id: 'ALLOW', label: 'allow' },
  { id: 'DENY', label: 'deny' },
];

const NAT_OPTIONS: PolicyFieldOption[] = [
  { id: 'NONE', label: 'No NAT' },
  { id: 'SNAT', label: 'Source NAT (SNAT)' },
  { id: 'DNAT', label: 'Destination NAT (DNAT)' },
  { id: 'DNAT+SNAT', label: 'U-Turn (DNAT+SNAT)' },
];

export function PolicyEditorMobile({
  level,
  config,
  onChange,
  onSubmit,
  disabled = false,
}: PolicyEditorMobileProps) {
  return (
    <Card className="flex flex-col gap-4" aria-label={`Editor de política: ${pickText(level.title, 'es')}`}>
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
      <PolicyField
        label="NAT"
        value={config.nat}
        options={NAT_OPTIONS}
        onChange={(v) => onChange('nat', v)}
        disabled={disabled}
      />
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

export default PolicyEditorMobile;
