// Puente a PAN-OS real (T3.4): deriva el comando `set` CLI equivalente a la
// política correcta del escenario. Función PURA (sin React), testeable.
//
// Genera dos rulebases SEPARADOS, igual que PAN-OS (ver invariante #6): Security
// (zonas, App-ID, servicio, acción, profile-setting) y NAT (source/destination
// translation). El texto se marca en la UI como "valida contra tu versión".

import { ZONES } from '../data/constants';
import type { Level, ZoneId, RequiredProfile, Action } from '../types/domain';

const ACTION_CLI: Record<Action, string> = { ALLOW: 'allow', DENY: 'deny' };

// Perfiles -> línea profile-setting (PAN-OS). 'none'/'any' => sin perfil.
function profileLine(ruleName: string, profile: RequiredProfile): string | null {
  if (profile === 'default') {
    return `set rulebase security rules "${ruleName}" profile-setting profiles virus default vulnerability default`;
  }
  if (profile === 'strict') {
    return `set rulebase security rules "${ruleName}" profile-setting profiles virus default vulnerability strict url-filtering default wildfire-analysis default`;
  }
  return null;
}

const zoneLabel = (id: ZoneId): string => ZONES[id]?.label ?? id;

export interface SetCommands {
  security: string[];
  nat: string[];
}

/**
 * Construye los comandos `set` equivalentes a la solución del nivel.
 */
export function buildSetCommands(level: Level, ruleName?: string): SetCommands {
  const sol = level.solution;
  const secName = (ruleName && ruleName.trim()) || `Rule-${level.id}`;
  const from = zoneLabel(sol.srcZone);
  const to = zoneLabel(sol.dstZone);

  // --- Security rulebase ---
  const security: string[] = [
    `set rulebase security rules "${secName}" from ${from} to ${to} ` +
      `source any destination any application ${sol.app} service ${sol.service} ` +
      `action ${ACTION_CLI[sol.action] ?? 'allow'}`,
  ];
  const pl = sol.action === 'ALLOW' ? profileLine(secName, sol.profile) : null;
  if (pl) security.push(pl);

  // --- NAT rulebase (tabla separada) ---
  const nat: string[] = [];
  if (sol.nat && sol.nat !== 'NONE') {
    const natName = `NAT-${level.id}`;
    const n = level.nat;
    const isDnat = sol.nat === 'DNAT' || sol.nat === 'DNAT+SNAT';
    const isSnat = sol.nat === 'SNAT' || sol.nat === 'DNAT+SNAT';
    const destMatch = isDnat ? (n.destination?.original ?? level.packet.dstIp) : 'any';

    let line =
      `set rulebase nat rules "${natName}" from ${from} to ${to} ` +
      `source any destination ${destMatch} service any`;
    if (isSnat) {
      line += ` source-translation dynamic-ip-and-port interface-address ip ${n.source?.translated ?? ''}`;
    }
    if (isDnat) {
      line += ` destination-translation translated-address ${n.destination?.translated ?? ''}`;
    }
    nat.push(line.trim());
  }

  return { security, nat };
}
