// policyFieldOptions — opciones compartidas de los editores de política móvil (EGC-12).
//
// `zona` viene de src/data/constants.ts (ZONES); `action` y `nat` se derivan de los literales
// del dominio (Action / NatType), que no tienen array de constantes. Se extraen aquí —antes
// duplicados en PolicyEditorMobile (EGC-11)— para que el editor Firewall y el editor NAT
// (La Centralita) compartan EXACTAMENTE las mismas opciones y no deriven entre sí.

import { ZONES } from '../../data/constants';
import type { PolicyFieldOption } from './firewall/PolicyField';

export const ZONE_OPTIONS: PolicyFieldOption[] = Object.values(ZONES).map((z) => ({
  id: z.id,
  label: z.label,
}));

export const ACTION_OPTIONS: PolicyFieldOption[] = [
  { id: 'ALLOW', label: 'allow' },
  { id: 'DENY', label: 'deny' },
];

export const NAT_OPTIONS: PolicyFieldOption[] = [
  { id: 'NONE', label: 'No NAT' },
  { id: 'SNAT', label: 'Source NAT (SNAT)' },
  { id: 'DNAT', label: 'Destination NAT (DNAT)' },
  { id: 'DNAT+SNAT', label: 'U-Turn (DNAT+SNAT)' },
];
