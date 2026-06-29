// StreakDashboard — panel de racha del perfil (EGC-12).
//
// Muestra StreakCounter (racha actual), récord, tokens de Freeze disponibles y un calendario
// de 14 días (punto lleno = completado, hielo = cubierto con Freeze, vacío = sin actividad).
// El historial viene de api.getStreakHistory(14) cuando hay backend; offline el calendario se
// oculta (el árbol local solo guarda el objeto Streak, no los días) — el resto sigue visible.

import { useEffect, useState } from 'react';
import { Badge, Card, StreakCounter } from '../ui';
import { useStreak } from '../../hooks/useStreak';
import { api, isOffline } from '../../services/api';
import type { StreakDay } from '../../types/domain';

const CALENDAR_DAYS = 14;

export type DayState = 'completed' | 'freeze' | 'absent';

function dayState(day: StreakDay): DayState {
  if (!day.active) return 'absent';
  return day.isFreeze ? 'freeze' : 'completed';
}

const STATE_STYLE: Record<DayState, string> = {
  completed: 'bg-success',
  freeze: 'bg-primary',
  absent: 'bg-neutral-200',
};

const STATE_LABEL: Record<DayState, string> = {
  completed: 'completado',
  freeze: 'protegido con Freeze',
  absent: 'sin actividad',
};

/**
 * Tira de calendario accesible (role="img" con etiqueta-resumen, como TrafficVisualizer; los
 * puntos individuales llevan `title` para el usuario vidente y son presentacionales para AT).
 * Exportada para test directo con fixtures.
 */
export function CalendarStrip({ days }: { days: StreakDay[] }) {
  // getStreakHistory devuelve DESC (más reciente primero); mostrar cronológico (ascendente).
  const ordered = [...days].slice(0, CALENDAR_DAYS).reverse();
  const completed = ordered.filter((d) => d.active && !d.isFreeze).length;
  const frozen = ordered.filter((d) => d.active && d.isFreeze).length;

  return (
    <div
      role="img"
      aria-label={`Últimos ${ordered.length} días: ${completed} completados, ${frozen} protegidos con Freeze.`}
      data-testid="streak-calendar"
      className="flex flex-wrap gap-1.5"
    >
      {ordered.map((d) => {
        const state = dayState(d);
        return (
          <span
            key={d.date}
            data-state={state}
            aria-hidden="true"
            title={`${d.date}: ${STATE_LABEL[state]}`}
            className={['h-4 w-4 rounded-full', STATE_STYLE[state]].join(' ')}
          />
        );
      })}
    </div>
  );
}

export function StreakDashboard() {
  const { streak, freezeTokens } = useStreak();
  const [history, setHistory] = useState<StreakDay[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.getStreakHistory(CALENDAR_DAYS);
        if (!cancelled && !isOffline(res)) setHistory(res.days);
      } catch {
        // Offline o error de red: el calendario se oculta; las métricas locales bastan.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = streak?.currentStreak ?? 0;
  const longest = streak?.longestStreak ?? 0;

  return (
    <Card aria-label="Panel de racha" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <StreakCounter count={current} active={current > 0} />
        <div className="flex flex-col items-end gap-1 text-mobile-xs text-neutral-500">
          <span>
            Récord: <strong className="tabular-nums text-neutral-800">{longest}</strong>
          </span>
          <Badge variant="warning">{freezeTokens} Freeze</Badge>
        </div>
      </div>

      {history && history.length > 0 ? (
        <CalendarStrip days={history} />
      ) : (
        <p className="text-mobile-xs text-neutral-400">
          El calendario de actividad aparece cuando hay conexión.
        </p>
      )}
    </Card>
  );
}

export default StreakDashboard;
