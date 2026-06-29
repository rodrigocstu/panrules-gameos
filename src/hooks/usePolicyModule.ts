// usePolicyModule — máquina de estado del módulo "Políticas de Red" (orden y shadowing, EGC-18).
//
// Espejo 1:1 de useNatModule/useFirewallModule: misma máquina de estado, misma persistencia
// anti-carrera, MISMO motor puro SIN modificarlo. Diferencias respecto a NAT:
//   (1) selecciona los 9 niveles Tier F (ids 1–9, como El Portero),
//   (2) el estado por nivel es un PolicyRule[] ORDENADO (no un único PolicyConfig),
//   (3) submitAnswer llama `evaluateOrdered(rules, level)` (motor de policy-order),
//   (4) `shadowReports` se deriva en vivo con `detectShadowing(rules)` para alimentar el banner,
//   (5) persiste bajo la clave `egc_policy_progress`.
//
// La progresión se decide por `verdict.isWin` (CLAUDE.md invariante #1), NUNCA por finalAction:
// una solución DENY correcta BLOQUEA el paquete (finalAction 'drop') pero es un acierto. El reset
// re-deriva el seed del nivel por reemplazo de array completo (invariante #8).
//
// Diseño del seed (variante B, runtime-derived, SIN tocar levels.ts): por cada nivel se construye
// un PolicyRule[] de 2 reglas — una regla ANCHA (src/dst/app='any', action OPUESTA a la solución)
// ENCIMA de una regla derivada verbatim de level.solution — forzando un shadowing vivo que el
// jugador resuelve reordenando o deshabilitando. Ver makeSeedRules.

import { useCallback, useRef, useState } from 'react';
import { evaluateOrdered, detectShadowing } from '../lib/firewall-engine';
import { LEVELS } from '../data/levels';
import type { Action, Level, PolicyRule, OrderedVerdict, ShadowReport } from '../types/domain';

export type PolicyPhase = 'playing' | 'correct' | 'failed' | 'complete';

/** Campos de una PolicyRule que el editor móvil permite editar. */
export type PolicyRuleField = 'srcZone' | 'dstZone' | 'app' | 'action';

const STORAGE_KEY = 'egc_policy_progress';

/** Los 9 niveles Tier F (ids 1–9), idénticos a los de El Portero (useFirewallModule). */
export const POLICY_LEVELS: Level[] = LEVELS.filter((l) => l.id >= 1 && l.id <= 9);

/**
 * Construye el seed de reglas ordenadas de un nivel (2 reglas):
 *
 *   [0] rule-broad    — regla ANCHA: src/dst/app='any', action OPUESTA a la solución, nat NONE,
 *                       profile none. Sombrea la regla solución (detectShadowing la reporta) y,
 *                       evaluada primero, NUNCA gana (su action difiere de la solución).
 *   [1] rule-solution — copia verbatim de los 7 campos de level.solution. Gana cuando es la
 *                       primera regla activa que matchea (jugador la sube o deshabilita la ancha).
 *
 * `service` de la regla ancha es 'service-http' (concreto), NO 'any': el nivel 3 (único con
 * specialCheck en 1–9) trata service 'any' como WARNING ganador y 'application-default' como
 * DROPPED ganador; un service concreto neutro cae en la rama de fallo del specialCheck, de modo
 * que la regla ancha NO gana por accidente en ese nivel. No afecta a detectShadowing (que ignora
 * el service) ni al resto de niveles (la regla ancha ya falla por action opuesta).
 *
 * `profile` de la regla solución mapea 'any' (RequiredProfile) → 'none': el motor trata
 * 'any' como "perfil irrelevante" y 'none' lo satisface (mismo mapeo que useNatModule.test).
 */
export function makeSeedRules(level: Level): PolicyRule[] {
  const s = level.solution;
  const oppositeAction: Action = s.action === 'ALLOW' ? 'DENY' : 'ALLOW';

  const broad: PolicyRule = {
    id: 'rule-broad',
    srcZone: 'any',
    dstZone: 'any',
    app: 'any',
    service: 'service-http',
    action: oppositeAction,
    nat: 'NONE',
    profile: 'none',
  };

  const solution: PolicyRule = {
    id: 'rule-solution',
    srcZone: s.srcZone,
    dstZone: s.dstZone,
    app: s.app,
    service: s.service,
    action: s.action,
    nat: s.nat,
    profile: s.profile === 'any' ? 'none' : s.profile,
  };

  return [broad, solution];
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

export interface UsePolicyModule {
  levels: Level[];
  level: Level;
  currentLevelIndex: number;
  levelNumber: number;
  total: number;
  rules: PolicyRule[];
  shadowReports: ShadowReport[];
  attemptCount: number;
  result: OrderedVerdict | null;
  phase: PolicyPhase;
  completedIds: number[];
  moveRuleUp: (idx: number) => void;
  moveRuleDown: (idx: number) => void;
  toggleRuleDisabled: (idx: number) => void;
  setRuleField: (idx: number, field: PolicyRuleField, value: string) => void;
  submitAnswer: () => OrderedVerdict;
  nextLevel: () => void;
  resetLevel: () => void;
  resetModule: () => void;
}

export function usePolicyModule(): UsePolicyModule {
  const levels = POLICY_LEVELS;

  // Espejo en memoria para incógnito (mismo patrón que useProgress/useNatModule): si localStorage
  // no está disponible, el progreso de la sesión sobrevive en este ref.
  const mirrorRef = useRef<number[]>(loadCompleted());

  const [completedIds, setCompletedIds] = useState<number[]>(() => mirrorRef.current);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(() => {
    const done = mirrorRef.current;
    const doneCount = levels.filter((l) => done.includes(l.id)).length;
    return Math.min(doneCount, Math.max(levels.length - 1, 0));
  });
  const [rules, setRules] = useState<PolicyRule[]>(() => makeSeedRules(levels[currentLevelIndex]));
  const [attemptCount, setAttemptCount] = useState(0);
  const [result, setResult] = useState<OrderedVerdict | null>(null);
  const [phase, setPhase] = useState<PolicyPhase>('playing');

  // Se deriva en cada render (igual que el MultiRuleEditor legacy): el banner refleja el shadowing
  // vigente de la lista ordenada actual.
  const shadowReports = detectShadowing(rules);

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

  const moveRuleUp = useCallback((idx: number) => {
    setRules((prev) => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveRuleDown = useCallback((idx: number) => {
    setRules((prev) => {
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const toggleRuleDisabled = useCallback((idx: number) => {
    setRules((prev) => {
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], disabled: !next[idx].disabled };
      return next;
    });
  }, []);

  const setRuleField = useCallback((idx: number, field: PolicyRuleField, value: string) => {
    setRules((prev) => {
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      // El string proviene siempre de los dropdowns del dominio (literal válido); cast controlado
      // para el sistema de tipos, igual que useFirewallModule.setField.
      next[idx] = { ...next[idx], [field]: value } as PolicyRule;
      return next;
    });
  }, []);

  const submitAnswer = useCallback((): OrderedVerdict => {
    const current = levels[currentLevelIndex];
    const verdict = evaluateOrdered(rules, current);
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
  }, [levels, currentLevelIndex, rules, persistCompletion]);

  const nextLevel = useCallback(() => {
    if (currentLevelIndex + 1 >= levels.length) {
      setPhase('complete');
      return;
    }
    const nextIndex = currentLevelIndex + 1;
    setCurrentLevelIndex(nextIndex);
    setRules(makeSeedRules(levels[nextIndex]));
    setAttemptCount(0);
    setResult(null);
    setPhase('playing');
  }, [currentLevelIndex, levels]);

  const resetLevel = useCallback(() => {
    setRules(makeSeedRules(levels[currentLevelIndex]));
    setAttemptCount(0);
    setResult(null);
    setPhase('playing');
  }, [levels, currentLevelIndex]);

  const resetModule = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
    mirrorRef.current = [];
    setCompletedIds([]);
    setCurrentLevelIndex(0);
    setRules(makeSeedRules(levels[0]));
    setAttemptCount(0);
    setResult(null);
    setPhase('playing');
  }, [levels]);

  return {
    levels,
    level: levels[currentLevelIndex],
    currentLevelIndex,
    levelNumber: currentLevelIndex + 1,
    total: levels.length,
    rules,
    shadowReports,
    attemptCount,
    result,
    phase,
    completedIds,
    moveRuleUp,
    moveRuleDown,
    toggleRuleDisabled,
    setRuleField,
    submitAnswer,
    nextLevel,
    resetLevel,
    resetModule,
  };
}
