// useFirewallModule — máquina de estado del módulo Firewall "El Portero" (EGC-11).
//
// Selecciona los 9 niveles L1–L9 (ids 1–9, tier F, índices 0–8), llama al motor puro
// `evaluate(config, level)` SIN modificarlo, y rastrea el progreso. La progresión se
// decide por `verdict.isWin` (CLAUDE.md invariante #1), NUNCA por finalAction: un DENY
// correcto o un specialCheck DROPPED bloquean el paquete pero SON aciertos.
//
// Reset al cambiar de nivel: se deriva un config limpio del estado inicial, no se
// enumeran campos a mano (invariante #8). Persistencia anti-carrera con re-lectura fresca
// de localStorage antes de escribir (patrón useProgress.commit, invariante #7 de timers
// no aplica aquí: sin timers).

import { useCallback, useRef, useState } from 'react';
import { evaluate } from '../lib/firewall-engine';
import { LEVELS } from '../data/levels';
import type { Level, PolicyConfig, Verdict } from '../types/domain';

export type PolicyEditableField =
  | 'srcZone'
  | 'dstZone'
  | 'app'
  | 'service'
  | 'action'
  | 'nat'
  | 'profile';

export type FirewallPhase = 'playing' | 'correct' | 'failed' | 'complete';

const STORAGE_KEY = 'egc_firewall_progress';

/** Los 9 niveles del módulo Firewall: ids 1–9 (tier F). L10 es tier F pero se excluye. */
export const FIREWALL_LEVELS: Level[] = LEVELS.filter((l) => l.id >= 1 && l.id <= 9);

/** Config inicial neutra: el jugador configura los 7 campos desde cero en cada nivel. */
function makeInitialConfig(): PolicyConfig {
  return {
    srcZone: 'trust',
    dstZone: 'trust',
    app: 'any',
    service: 'any',
    action: 'ALLOW',
    nat: 'NONE',
    profile: 'none',
  };
}

interface PersistShape {
  completed: number[];
}

function loadCompleted(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as PersistShape).completed)) {
      return (parsed as PersistShape).completed.filter((n) => typeof n === 'number');
    }
    return [];
  } catch {
    return [];
  }
}

export interface UseFirewallModule {
  levels: Level[];
  level: Level;
  currentLevelIndex: number;
  levelNumber: number;
  total: number;
  config: PolicyConfig;
  attemptCount: number;
  result: Verdict | null;
  phase: FirewallPhase;
  completedIds: number[];
  setField: (field: PolicyEditableField, value: string) => void;
  submitAnswer: () => Verdict;
  nextLevel: () => void;
  resetLevel: () => void;
  resetModule: () => void;
}

export function useFirewallModule(): UseFirewallModule {
  const levels = FIREWALL_LEVELS;

  // Espejo en memoria para incógnito (mismo patrón que useProgress): si localStorage no
  // está disponible, el progreso de la sesión sobrevive en este ref.
  const mirrorRef = useRef<number[]>(loadCompleted());

  const [completedIds, setCompletedIds] = useState<number[]>(() => mirrorRef.current);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(() => {
    const done = mirrorRef.current;
    const doneCount = levels.filter((l) => done.includes(l.id)).length;
    return Math.min(doneCount, Math.max(levels.length - 1, 0));
  });
  const [config, setConfig] = useState<PolicyConfig>(makeInitialConfig);
  const [attemptCount, setAttemptCount] = useState(0);
  const [result, setResult] = useState<Verdict | null>(null);
  const [phase, setPhase] = useState<FirewallPhase>('playing');

  const persistCompletion = useCallback((id: number) => {
    // Re-lee fresco antes de escribir (anti-carrera multi-pestaña, patrón useProgress).
    const fresh = loadCompleted();
    const base = fresh.length > 0 ? fresh : mirrorRef.current;
    const next = base.includes(id) ? base : [...base, id];
    mirrorRef.current = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: next }));
    } catch {
      // Incógnito: el progreso queda en mirrorRef; el módulo sigue jugable.
    }
    setCompletedIds(next);
  }, []);

  const setField = useCallback((field: PolicyEditableField, value: string) => {
    // Las opciones provienen de los dropdowns del dominio (ZONES/APPS/SERVICES/PROFILES y
    // las listas locales action/nat), así que el string es siempre un literal válido;
    // cast controlado para el sistema de tipos (mismo criterio que el motor).
    setConfig((prev) => ({ ...prev, [field]: value }) as PolicyConfig);
  }, []);

  const submitAnswer = useCallback((): Verdict => {
    const current = levels[currentLevelIndex];
    const verdict = evaluate(config, current);
    if (verdict.isWin) {
      setResult(verdict);
      setPhase('correct');
      persistCompletion(current.id);
    } else {
      setResult(verdict);
      setAttemptCount((a) => a + 1);
      setPhase('failed');
    }
    return verdict;
  }, [levels, currentLevelIndex, config, persistCompletion]);

  const nextLevel = useCallback(() => {
    if (currentLevelIndex + 1 >= levels.length) {
      setPhase('complete');
      return;
    }
    setCurrentLevelIndex(currentLevelIndex + 1);
    setConfig(makeInitialConfig());
    setAttemptCount(0);
    setResult(null);
    setPhase('playing');
  }, [currentLevelIndex, levels.length]);

  const resetLevel = useCallback(() => {
    setConfig(makeInitialConfig());
    setAttemptCount(0);
    setResult(null);
    setPhase('playing');
  }, []);

  const resetModule = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
    mirrorRef.current = [];
    setCompletedIds([]);
    setCurrentLevelIndex(0);
    setConfig(makeInitialConfig());
    setAttemptCount(0);
    setResult(null);
    setPhase('playing');
  }, []);

  return {
    levels,
    level: levels[currentLevelIndex],
    currentLevelIndex,
    levelNumber: currentLevelIndex + 1,
    total: levels.length,
    config,
    attemptCount,
    result,
    phase,
    completedIds,
    setField,
    submitAnswer,
    nextLevel,
    resetLevel,
    resetModule,
  };
}
