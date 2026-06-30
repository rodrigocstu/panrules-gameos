// PolicyListEditorMobile — editor móvil de reglas ORDENADAS (EGC-18, módulo Políticas de Red).
//
// Superficie novel: NO espeja el legacy MultiRuleEditor.jsx (tabla de escritorio con <select>),
// sino que reusa su MECÁNICA (reorder up/down, enable/disable, edición de campos) sobre un layout
// móvil de tarjetas. Cada regla es una tarjeta con chips PolicyField (≥44px, aria-pressed) para
// srcZone/dstZone/app/action, un toggle habilitar/deshabilitar y botones subir/bajar con área
// táctil ≥44px. Las reglas sombreadas (en shadowReports) se amortiguan visualmente Y se anuncian
// en texto/aria (no solo color, contraste AA). La ruta de victoria es reordenar/deshabilitar para
// que la regla solución se alcance.

import { ChevronUp, ChevronDown } from 'lucide-react';
import { Badge, Button, Card } from '../../ui';
import { APPS } from '../../../data/constants';
import type { PolicyRule, ShadowReport } from '../../../types/domain';
import type { PolicyRuleField } from '../../../hooks/usePolicyModule';
import { PolicyField, type PolicyFieldOption } from '../firewall/PolicyField';
import { ZONE_OPTIONS, ACTION_OPTIONS } from '../policyFieldOptions';

// Las PolicyRule admiten zona 'any' (wildcard), que ZONE_OPTIONS no trae: se antepone aquí.
const RULE_ZONE_OPTIONS: PolicyFieldOption[] = [{ id: 'any', label: 'any' }, ...ZONE_OPTIONS];

export interface PolicyListEditorMobileProps {
  rules: PolicyRule[];
  shadowReports: ShadowReport[];
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onToggleDisabled: (idx: number) => void;
  onSetField: (idx: number, field: PolicyRuleField, value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function PolicyListEditorMobile({
  rules,
  shadowReports,
  onMoveUp,
  onMoveDown,
  onToggleDisabled,
  onSetField,
  onSubmit,
  disabled = false,
}: PolicyListEditorMobileProps) {
  const shadowedIds = new Set(shadowReports.map((r) => r.shadowedRuleId));

  return (
    <Card className="flex flex-col gap-4" aria-label="Editor de reglas ordenadas">
      <ol className="flex flex-col gap-3">
        {rules.map((rule, idx) => {
          const isShadowed = shadowedIds.has(rule.id);
          const isOff = rule.disabled === true;
          const ruleName = `Regla ${idx + 1}`;
          return (
            <li
              key={rule.id}
              data-testid={`policy-rule-${idx}`}
              data-shadowed={isShadowed ? 'true' : 'false'}
              data-disabled={isOff ? 'true' : 'false'}
              className={[
                'rounded-xl border p-3',
                isShadowed ? 'border-accent/60 bg-accent/5' : 'border-neutral-200 bg-white',
                isOff ? 'opacity-60' : '',
              ].join(' ')}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-mobile-sm font-bold tabular-nums text-neutral-900">
                    {ruleName}
                  </span>
                  <Badge variant={rule.action === 'ALLOW' ? 'success' : 'error'}>
                    {rule.action}
                  </Badge>
                  {isOff && <Badge variant="default">deshabilitada</Badge>}
                  {isShadowed && <Badge variant="warning">sombreada</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onMoveUp(idx)}
                    disabled={disabled || idx === 0}
                    aria-label={`Subir ${ruleName}`}
                    className="flex min-h-touch min-w-touch items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronUp size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveDown(idx)}
                    disabled={disabled || idx === rules.length - 1}
                    aria-label={`Bajar ${ruleName}`}
                    className="flex min-h-touch min-w-touch items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronDown size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {isShadowed && (
                <p className="mb-2 text-mobile-xs font-medium text-accent-dark">
                  Esta regla está sombreada: una regla anterior la alcanza primero, así que nunca se
                  evalúa.
                </p>
              )}

              <div className="flex flex-col gap-3">
                <PolicyField
                  label="Zona origen"
                  value={rule.srcZone}
                  options={RULE_ZONE_OPTIONS}
                  onChange={(v) => onSetField(idx, 'srcZone', v)}
                  disabled={disabled || isOff}
                />
                <PolicyField
                  label="Zona destino"
                  value={rule.dstZone}
                  options={RULE_ZONE_OPTIONS}
                  onChange={(v) => onSetField(idx, 'dstZone', v)}
                  disabled={disabled || isOff}
                />
                <PolicyField
                  label="Aplicación (App-ID)"
                  value={rule.app}
                  options={APPS}
                  onChange={(v) => onSetField(idx, 'app', v)}
                  disabled={disabled || isOff}
                />
                <PolicyField
                  label="Acción"
                  value={rule.action}
                  options={ACTION_OPTIONS}
                  onChange={(v) => onSetField(idx, 'action', v)}
                  disabled={disabled || isOff}
                />
              </div>

              <button
                type="button"
                onClick={() => onToggleDisabled(idx)}
                disabled={disabled}
                aria-pressed={isOff}
                aria-label={isOff ? `Habilitar ${ruleName}` : `Deshabilitar ${ruleName}`}
                className="mt-3 flex min-h-touch w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-mobile-sm font-medium text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isOff ? 'Habilitar regla' : 'Deshabilitar regla'}
              </button>
            </li>
          );
        })}
      </ol>

      <Button variant="primary" size="lg" className="w-full" onClick={onSubmit} disabled={disabled}>
        Comprobar
      </Button>
    </Card>
  );
}

export default PolicyListEditorMobile;
