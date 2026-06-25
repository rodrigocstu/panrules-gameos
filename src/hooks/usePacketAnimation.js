import { useState, useRef, useEffect } from 'react';
import { evaluate } from '../lib/firewall-engine.js';

// Estado inicial del paquete (centro del visualizer, invisible).
const INITIAL_PACKET = { x: 50, y: 50, opacity: 0, color: 'bg-white', label: '' };

// Coordenadas afinadas para el grid del visualizer (cajas a ~17% / ~83%).
function getZoneCoords(zoneId) {
  switch (zoneId) {
    case 'trust':
      return { x: 17, y: 25 };
    case 'untrust':
      return { x: 83, y: 25 };
    case 'guest':
      return { x: 17, y: 75 };
    case 'dmz':
      return { x: 83, y: 75 };
    case 'firewall':
      return { x: 50, y: 50 };
    default:
      return { x: 50, y: 50 };
  }
}

/**
 * usePacketAnimation — orquesta la animación del paquete (commit → firewall →
 * NAT → veredicto) y es DUEÑO de todos sus timers.
 *
 * Resuelve el invariante #7 (CLAUDE.md): cada setInterval/setTimeout se registra
 * y se limpia en el desmontaje y al resetear, evitando fugas y updates sobre un
 * componente desmontado. La animación queda cancelable al cambiar de nivel
 * (invariante #8 / criterio T1.4).
 *
 * El comportamiento (tiempos, transformaciones visuales, ramas de veredicto) es
 * idéntico al de la versión embebida en App.jsx. Los inputs (level + config) se
 * pasan como snapshot al iniciar `startCommit`, porque los selects están
 * deshabilitados durante la animación y no pueden cambiar.
 *
 * @param {Object}   params
 * @param {(phase: 'committing'|'animating') => void} params.onPhase
 * @param {(isWin: boolean, reason: string, effect: 'allow'|'drop') => void} params.onResult
 */
export function usePacketAnimation({ onPhase, onResult }) {
  const [packetCoords, setPacketCoords] = useState(INITIAL_PACKET);
  const [commitProgress, setCommitProgress] = useState(0);
  const timers = useRef([]);

  const track = (id) => {
    timers.current.push(id);
    return id;
  };

  const clearTimers = () => {
    // setTimeout y setInterval comparten espacio de ids (HTML spec): limpiar con
    // ambos clear* es seguro e idempotente.
    timers.current.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
    });
    timers.current = [];
  };

  // Limpieza al desmontar: no dejar timers colgando (invariante #7).
  useEffect(() => clearTimers, []);

  // Reset del paquete al cambiar de nivel: cancela la animación en curso.
  const resetPacket = () => {
    clearTimers();
    setPacketCoords(INITIAL_PACKET);
    setCommitProgress(0);
  };

  const evaluateTraffic = (level, config, endCoords) => {
    const verdict = evaluate(config, level);

    // Rama terminal de specialCheck: el paquete cae, no anima al destino.
    if (verdict.terminal) {
      onResult(true, verdict.resultMsg, 'drop');
      setPacketCoords((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    if (verdict.finalAction === 'allow' && verdict.isWin) {
      setPacketCoords((prev) => ({ ...prev, x: endCoords.x, y: endCoords.y }));
      track(setTimeout(() => onResult(true, verdict.resultMsg, 'allow'), 1000));
    } else {
      setPacketCoords((prev) => ({ ...prev, opacity: 0, scale: 2 }));
      track(setTimeout(() => onResult(verdict.isWin, verdict.resultMsg, 'drop'), 500));
    }
  };

  const runPacketAnimation = (level, config) => {
    const start = getZoneCoords(level.packet.srcZone);
    const fw = getZoneCoords('firewall');
    const end = getZoneCoords(level.packet.dstZone);

    // 1. Aparecer en el origen.
    setPacketCoords({ ...start, opacity: 1, color: 'bg-yellow-400', label: level.packet.srcIp });

    // 2. Moverse al firewall.
    track(
      setTimeout(() => {
        setPacketCoords((prev) => ({ ...prev, x: fw.x, y: fw.y }));
      }, 500)
    );

    // 3. Procesar y TRANSFORMAR (NAT visual), luego evaluar.
    track(
      setTimeout(() => {
        let nextColor = 'bg-yellow-400';
        let nextLabel = level.packet.srcIp;

        if (config.action === 'ALLOW') {
          if (config.nat === 'SNAT') {
            nextColor = 'bg-orange-500';
            nextLabel = 'NAT: 203.0.113.1';
          } else if (config.nat === 'DNAT') {
            nextColor = 'bg-purple-500';
            nextLabel = `NAT: ${level.packet.srcIp}`;
          } else if (config.nat === 'DNAT+SNAT') {
            nextColor = 'bg-purple-500 border-2 border-orange-500';
            nextLabel = 'U-TURN NAT';
          }
        }

        setPacketCoords((prev) => ({ ...prev, color: nextColor, label: nextLabel }));
        evaluateTraffic(level, config, end);
      }, 1500)
    );
  };

  const startCommit = (level, config) => {
    clearTimers();
    onPhase('committing');
    setCommitProgress(0);
    const start = getZoneCoords(level.packet.srcZone);
    setPacketCoords({ ...start, opacity: 0, color: 'bg-white', label: level.packet.proto });

    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      if (p >= 100) {
        clearInterval(interval);
        setCommitProgress(100);
        track(
          setTimeout(() => {
            onPhase('animating');
            runPacketAnimation(level, config);
          }, 500)
        );
      } else {
        setCommitProgress(p);
      }
    }, 50);
    track(interval);
  };

  return { packetCoords, commitProgress, startCommit, resetPacket };
}
