// Construcción del registro de tráfico que se muestra en el panel de logs.
// Lógica de dominio pura (sin React), reutilizable y testeable.

import type { Level } from '../types/domain.js';

export interface TrafficLog {
  id: number;
  time: string;
  src: string;
  dst: string;
  app: string;
  action: string;
  bytes: number;
  reason: string;
  flags: string;
  country: string;
}

export function createLog(level: Level, effect: 'allow' | 'drop', reason: string): TrafficLog {
  return {
    id: Date.now(),
    time: new Date().toLocaleTimeString(),
    src: level.packet.srcIp,
    dst: level.packet.dstIp,
    app: level.packet.app,
    action: effect.toUpperCase(),
    bytes: effect === 'allow' ? Math.floor(Math.random() * 5000) + 500 : 0,
    reason,
    flags: effect === 'allow' ? '0x00' : '0xBAD',
    country: 'US -> US',
  };
}
