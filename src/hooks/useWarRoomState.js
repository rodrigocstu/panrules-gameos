import { useState, useEffect, useRef, useCallback } from 'react';

// Collaborative War Room (concepto disruptivo 5.3) — estado compartido entre
// pestañas del MISMO navegador/origen, SIN servidor.
//
// Sincronización: BroadcastChannel (primitivo moderno para mensajería entre
// pestañas del mismo origen). Fallback de persistencia: localStorage + el evento
// `storage` (que dispara en LAS OTRAS pestañas al cambiar el storage), de modo
// que una pestaña que se une recupera el estado actual.
//
// Nota de alcance: BroadcastChannel y el evento `storage` son same-origin,
// same-browser. El "multijugador" aquí es colaboración multi-pestaña en una
// máquina (ideal para demo en aula / instructor observando). Cross-device real
// exigiría WebRTC + signaling (servidor) — fuera de alcance (sin backend).

const CHANNEL = 'panrules-gameos:warroom:v1';
const STORAGE = 'panrules-gameos:warroom:state:v1';

export const ROLES = ['security', 'nat', 'validator', 'instructor'];

export const DEFAULT_CONFIG = {
  srcZone: 'trust',
  dstZone: 'untrust',
  app: 'any',
  service: 'application-default',
  action: 'ALLOW',
  nat: 'NONE',
  profile: 'none',
};

export const DEFAULT_STATE = {
  players: [],
  config: { ...DEFAULT_CONFIG },
  paused: false,
  levelId: 1,
  result: null,
  version: 0,
};

export function makePlayerId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Reductores puros (testeables sin canal ni DOM) ──────────────────────────
export function applyJoin(state, id, name, role) {
  const players = [
    ...state.players.filter((p) => p.id !== id),
    { id, name: (name || '').trim() || 'Jugador', role },
  ];
  return { ...state, players, version: state.version + 1 };
}

export function applyLeave(state, id) {
  return { ...state, players: state.players.filter((p) => p.id !== id), version: state.version + 1 };
}

export function applyConfig(state, patch) {
  if (state.paused) return state; // en pausa no se edita
  return { ...state, config: { ...state.config, ...patch }, version: state.version + 1 };
}

export function applyPause(state, paused) {
  return { ...state, paused, version: state.version + 1 };
}

export function applyResult(state, result) {
  return { ...state, result, version: state.version + 1 };
}

// Nuevo ticket: cambia de nivel y resetea config + resultado.
export function applyTicket(state, levelId) {
  return {
    ...state,
    levelId,
    config: { ...DEFAULT_CONFIG },
    result: null,
    version: state.version + 1,
  };
}

// ─── Persistencia ────────────────────────────────────────────────────────────
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.players) || typeof parsed.config !== 'object') {
      return { ...DEFAULT_STATE };
    }
    return parsed;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(state));
  } catch {
    // Silencioso.
  }
}

function openChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  try {
    return new BroadcastChannel(CHANNEL);
  } catch {
    return null;
  }
}

/**
 * useWarRoomState — estado compartido del War Room para la pestaña actual.
 * Devuelve el estado y acciones; cada acción persiste y difunde a otras pestañas.
 */
export function useWarRoomState() {
  const [state, setState] = useState(loadState);
  const myIdRef = useRef(makePlayerId());
  const channelRef = useRef(null);
  // Mantener el último estado accesible en callbacks sin recrearlos.
  const stateRef = useRef(state);
  stateRef.current = state;

  const publish = useCallback((next) => {
    saveState(next);
    setState(next);
    channelRef.current?.postMessage({ type: 'state', state: next });
  }, []);

  useEffect(() => {
    const ch = openChannel();
    channelRef.current = ch;

    const onMessage = (e) => {
      const data = e.data;
      if (!data) return;
      if (data.type === 'state') {
        // Aceptar solo estados más nuevos (evita parpadeos por carreras).
        if ((data.state?.version ?? 0) >= (stateRef.current.version ?? 0)) {
          setState(data.state);
          saveState(data.state);
        }
      } else if (data.type === 'request') {
        ch?.postMessage({ type: 'state', state: stateRef.current });
      }
    };
    if (ch) ch.addEventListener('message', onMessage);

    const onStorage = (e) => {
      if (e.key === STORAGE && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {
          // Ignorar valores corruptos.
        }
      }
    };
    window.addEventListener('storage', onStorage);

    // Al unirse, pedir el estado actual a las demás pestañas.
    ch?.postMessage({ type: 'request' });

    return () => {
      if (ch) {
        ch.removeEventListener('message', onMessage);
        ch.close();
      }
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Salir limpiamente al cerrar la pestaña.
  useEffect(() => {
    const onUnload = () => publish(applyLeave(stateRef.current, myIdRef.current));
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [publish]);

  const join = useCallback(
    (name, role) => publish(applyJoin(stateRef.current, myIdRef.current, name, role)),
    [publish]
  );
  const leave = useCallback(
    () => publish(applyLeave(stateRef.current, myIdRef.current)),
    [publish]
  );
  const updateConfig = useCallback(
    (patch) => publish(applyConfig(stateRef.current, patch)),
    [publish]
  );
  const setPaused = useCallback(
    (paused) => publish(applyPause(stateRef.current, paused)),
    [publish]
  );
  const setResult = useCallback(
    (result) => publish(applyResult(stateRef.current, result)),
    [publish]
  );
  const newTicket = useCallback(
    (levelId) => publish(applyTicket(stateRef.current, levelId)),
    [publish]
  );

  const me = state.players.find((p) => p.id === myIdRef.current) ?? null;

  return { state, me, myId: myIdRef.current, join, leave, updateConfig, setPaused, setResult, newTicket };
}
