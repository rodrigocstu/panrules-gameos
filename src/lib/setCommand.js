// Puente a PAN-OS real (T3.4): deriva el comando `set` CLI equivalente a la
// política correcta del escenario. Función PURA (sin React), testeable.
//
// Genera dos rulebases SEPARADOS, igual que PAN-OS (ver invariante #6):
//  - Security rulebase: la regla de seguridad (zonas, App-ID, servicio, acción,
//    y profile-setting si la regla permite tráfico).
//  - NAT rulebase: la regla NAT (source/destination translation), solo si el
//    escenario usa NAT.
//
// Las IPs y zonas se derivan de `level.solution` y `level.nat` (la respuesta
// canónica). El texto se marca en la UI como "valida contra tu versión de
// PAN-OS": la sintaxis `set` varía ligeramente entre versiones/plataformas.

import { ZONES } from '../data/constants.js';

const ACTION_CLI = { ALLOW: 'allow', DENY: 'deny' };

// Perfiles -> línea profile-setting (PAN-OS). 'none'/'any' => sin perfil
// (una regla deny o sin requisito no inspecciona amenazas).
function profileLine(ruleName, profile) {
  if (profile === 'default') {
    return `set rulebase security rules "${ruleName}" profile-setting profiles virus default vulnerability default`;
  }
  if (profile === 'strict') {
    return `set rulebase security rules "${ruleName}" profile-setting profiles virus default vulnerability strict url-filtering default wildfire-analysis default`;
  }
  return null;
}

const zoneLabel = (id) => ZONES[id]?.label ?? id;

/**
 * Construye los comandos `set` equivalentes a la solución del nivel.
 *
 * @param {Object} level     escenario (usa level.solution y level.nat).
 * @param {string} [ruleName] nombre de la regla de seguridad (default Rule-<id>).
 * @returns {{ security: string[], nat: string[] }}
 */
export function buildSetCommands(level, ruleName) {
  const sol = level.solution;
  const secName = (ruleName && ruleName.trim()) || `Rule-${level.id}`;
  const from = zoneLabel(sol.srcZone);
  const to = zoneLabel(sol.dstZone);

  // --- Security rulebase ---
  const security = [
    `set rulebase security rules "${secName}" from ${from} to ${to} ` +
      `source any destination any application ${sol.app} service ${sol.service} ` +
      `action ${ACTION_CLI[sol.action] ?? 'allow'}`,
  ];
  // El profile-setting solo aplica a reglas que PERMITEN tráfico.
  const pl = sol.action === 'ALLOW' ? profileLine(secName, sol.profile) : null;
  if (pl) security.push(pl);

  // --- NAT rulebase (tabla separada) ---
  const nat = [];
  if (sol.nat && sol.nat !== 'NONE') {
    const natName = `NAT-${level.id}`;
    const n = level.nat ?? {};
    const isDnat = sol.nat === 'DNAT' || sol.nat === 'DNAT+SNAT';
    const isSnat = sol.nat === 'SNAT' || sol.nat === 'DNAT+SNAT';
    // En DNAT/U-Turn la regla matchea la IP destino pública original; en SNAT puro
    // el destino es 'any' (traducimos el origen al salir).
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
