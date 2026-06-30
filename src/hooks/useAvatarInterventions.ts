// useAvatarInterventions — estado de UI de las intervenciones automáticas de NORA.
//
// Pura UI: sin red, sin localStorage. Selección de variante DETERMINISTA (bible §5.6,
// reproducibilidad en QA), nunca aleatoria. Auto-oculta la burbuja a los 4 s con
// limpieza de timer en el desmontaje (CLAUDE.md invariante #7).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Level, ReasonCode, Verdict } from '../types/domain';
import { pickText } from '../i18n/pickText';
import {
  AVATAR_INTERVENTIONS,
  HINT_TOKEN,
  type AvatarInterventionKey,
  type AvatarInterventionCopy,
} from '../lib/avatar-copy';

/** Retardo de auto-ocultado de la burbuja (ms). */
export const AVATAR_AUTO_HIDE_MS = 4000;

type VerdictLike = Pick<Verdict, 'reasonCode'>;

export interface AvatarInterventionContext {
  attemptCount?: number;
  levelId?: number;
  level?: Level | null;
  verdict?: VerdictLike | null;
}

export interface UseAvatarInterventions {
  currentMessage: string | null;
  isVisible: boolean;
  /** Muestra un mensaje ya resuelto reutilizando la máquina de auto-ocultado + cleanup de
   * timer (invariante #7). Lo usa el hook de situaciones globales (EGC-17) para no duplicar
   * una segunda implementación de timer. No-op si el mensaje es null/''. */
  showMessage: (message: string | null) => void;
  triggerIntervention: (key: AvatarInterventionKey, ctx?: AvatarInterventionContext) => void;
  onWrongAttempt: (
    attemptCount: number,
    verdict?: VerdictLike | null,
    level?: Level | null
  ) => void;
  onCorrect: (attemptCount: number) => void;
  dismiss: () => void;
}

export function useAvatarInterventions(
  autoHideMs: number = AVATAR_AUTO_HIDE_MS,
  // Conjunto de copy a usar. Default = El Portero (Firewall); La Centralita pasa
  // NAT_INTERVENTIONS. Backward-compatible: los llamadores existentes no cambian (EGC-12).
  copy: AvatarInterventionCopy = AVATAR_INTERVENTIONS
): UseAvatarInterventions {
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback(
    (message: string | null) => {
      if (!message) return;
      clearTimer();
      setCurrentMessage(message);
      setIsVisible(true);
      if (autoHideMs > 0) {
        timerRef.current = setTimeout(() => {
          setIsVisible(false);
          timerRef.current = null;
        }, autoHideMs);
      }
    },
    [autoHideMs, clearTimer]
  );

  const dismiss = useCallback(() => {
    clearTimer();
    setIsVisible(false);
  }, [clearTimer]);

  // Invariante #7: limpiar el timer pendiente al desmontar.
  useEffect(() => clearTimer, [clearTimer]);

  const resolveWrong = useCallback(
    (attemptCount: number, verdict?: VerdictLike | null, level?: Level | null): string | null => {
      // Intento 1 — direccional genérico (§4.2).
      if (attemptCount <= 1) {
        return copy.first_wrong[0];
      }
      // Intento 2 — concepto por reasonCode (§4.2). Fallback documentado a la genérica
      // para los reasonCodes sin línea verbatim (gap UXW: ACTION/SERVICE/PROFILE_*).
      if (attemptCount === 2) {
        const code: ReasonCode | undefined = verdict?.reasonCode;
        const concept = code ? copy.second_wrong[code] : undefined;
        return concept ?? copy.first_wrong[0];
      }
      // Intento ≥3 — indicación directa con el valor exacto de levels.ts (§4.8).
      const frame = copy.third_wrong_frame[0] ?? '';
      const hint = pickText(level?.hint, 'es');
      return frame.replace(HINT_TOKEN, hint);
    },
    [copy]
  );

  const onWrongAttempt = useCallback(
    (attemptCount: number, verdict?: VerdictLike | null, level?: Level | null) => {
      show(resolveWrong(attemptCount, verdict, level));
    },
    [resolveWrong, show]
  );

  const onCorrect = useCallback(
    (attemptCount: number) => {
      // §4.7 sólo cubre acierto en 2.º intento (idx 0) y 3.er+ (idx 1). El acierto a la
      // primera no tiene línea verbatim → sin burbuja (lo celebra LevelComplete).
      const variants = copy.correct;
      if (attemptCount <= 1 || variants.length === 0) return;
      const idx = Math.min(attemptCount - 2, variants.length - 1);
      show(variants[idx]);
    },
    [copy, show]
  );

  const triggerIntervention = useCallback(
    (key: AvatarInterventionKey, ctx?: AvatarInterventionContext) => {
      switch (key) {
        case 'first_wrong':
        case 'second_wrong':
        case 'third_wrong':
          onWrongAttempt(ctx?.attemptCount ?? 1, ctx?.verdict, ctx?.level);
          return;
        case 'correct':
          onCorrect(ctx?.attemptCount ?? 1);
          return;
        case 'module_complete':
          show(copy.module_complete[0] ?? null);
          return;
        case 'level_complete': {
          const variants = copy.level_complete;
          if (variants.length === 0) return;
          // Determinista por id de nivel (bible §5.6).
          const idx = ((((ctx?.levelId ?? 1) - 1) % variants.length) + variants.length) % variants.length;
          show(variants[idx]);
          return;
        }
      }
    },
    [copy, onCorrect, onWrongAttempt, show]
  );

  return { currentMessage, isVisible, showMessage: show, triggerIntervention, onWrongAttempt, onCorrect, dismiss };
}
