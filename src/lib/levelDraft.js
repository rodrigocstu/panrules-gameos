import { evaluate } from './firewall-engine';

// Helpers puros (sin React) para el Level Builder: construir un objeto Level a
// partir de un borrador de formulario y validarlo contra el motor. Testeable.

export const EMPTY_DRAFT = {
  id: 44,
  tier: 'F',
  tracks: ['ngfw-engineer'],
  titleEs: '',
  titleEn: '',
  descEs: '',
  descEn: '',
  srcZone: 'trust',
  dstZone: 'untrust',
  srcIp: '10.1.1.50',
  dstIp: '8.8.8.8',
  packetApp: 'ssl',
  solApp: 'ssl',
  solService: 'application-default',
  solAction: 'ALLOW',
  solNat: 'SNAT',
  solProfile: 'default',
  hintEs: '',
  hintEn: '',
  explEs: '',
  explEn: '',
};

// Bloque NAT decorativo derivado del tipo elegido (traducciones de ejemplo).
function buildNat(draft) {
  const type = draft.solNat;
  const snat = type === 'SNAT' || type === 'DNAT+SNAT';
  const dnat = type === 'DNAT' || type === 'DNAT+SNAT';
  return {
    type,
    source: { original: draft.srcIp, translated: snat ? '203.0.113.1' : draft.srcIp },
    destination: { original: draft.dstIp, translated: dnat ? '192.168.50.10' : draft.dstIp },
    packetLabel: type === 'NONE' ? 'No NAT' : type,
  };
}

export function buildLevel(draft) {
  return {
    id: Number(draft.id),
    tier: draft.tier,
    tracks: [...draft.tracks],
    title: { es: draft.titleEs, en: draft.titleEn },
    desc: { es: draft.descEs, en: draft.descEn },
    packet: {
      srcZone: draft.srcZone,
      dstZone: draft.dstZone,
      srcIp: draft.srcIp,
      dstIp: draft.dstIp,
      proto: 'TCP',
      app: draft.packetApp,
    },
    solution: {
      srcZone: draft.srcZone,
      dstZone: draft.dstZone,
      app: draft.solApp,
      service: draft.solService,
      action: draft.solAction,
      nat: draft.solNat,
      profile: draft.solProfile,
    },
    nat: buildNat(draft),
    hint: { es: draft.hintEs, en: draft.hintEn },
    explanation: { es: draft.explEs, en: draft.explEn },
  };
}

// Valida campos requeridos + consistencia interna: la propia solución del nivel,
// pasada como configuración del jugador, debe producir un acierto en el motor.
export function validateDraft(draft) {
  const fieldErrors = [];
  if (!draft.titleEs.trim() || !draft.titleEn.trim()) fieldErrors.push('title');
  if (!draft.descEs.trim() || !draft.descEn.trim()) fieldErrors.push('desc');
  if (!draft.hintEs.trim() || !draft.hintEn.trim()) fieldErrors.push('hint');
  if (!draft.explEs.trim() || !draft.explEn.trim()) fieldErrors.push('explanation');
  if (!Number.isInteger(Number(draft.id)) || Number(draft.id) <= 0) fieldErrors.push('id');
  if (!draft.tracks || draft.tracks.length === 0) fieldErrors.push('tracks');

  const level = buildLevel(draft);
  const config = {
    srcZone: level.solution.srcZone,
    dstZone: level.solution.dstZone,
    app: level.solution.app,
    service: level.solution.service,
    action: level.solution.action,
    nat: level.solution.nat,
    profile: level.solution.profile === 'any' ? 'none' : level.solution.profile,
  };
  const verdict = evaluate(config, level);

  return {
    valid: fieldErrors.length === 0 && verdict.isWin,
    fieldErrors,
    verdict,
    level,
  };
}
