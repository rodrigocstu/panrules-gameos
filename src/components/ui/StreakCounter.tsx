import { Flame } from 'lucide-react';

export interface StreakCounterProps {
  /** Number of consecutive days in the streak */
  count: number;
  /** Whether the streak is currently active — defaults to true */
  active?: boolean;
  /** Extra Tailwind classes on the container */
  className?: string;
}

/**
 * NORA Design System — StreakCounter.
 * Displays a numeric streak value alongside a flame icon.
 * Pulses when count >= 7 and active (respects prefers-reduced-motion via
 * `motion-safe:` Tailwind variant).
 */
export function StreakCounter({ count, active = true, className = '' }: StreakCounterProps) {
  const days = count === 1 ? 'día' : 'días';
  const state = active ? 'activa' : 'inactiva';

  return (
    <div
      role="img"
      aria-label={`Racha: ${count} ${days} ${state}`}
      className={[
        'inline-flex items-center gap-1 font-semibold select-none',
        active ? 'text-accent' : 'text-neutral-400',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="ui-streak-counter"
    >
      <Flame
        size={20}
        aria-hidden="true"
        className={[
          'shrink-0',
          active && count >= 7 ? 'motion-safe:animate-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
      <span className="text-mobile-lg tabular-nums">{count}</span>
    </div>
  );
}

export default StreakCounter;
