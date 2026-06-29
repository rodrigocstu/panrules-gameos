export type ProgressBarColor = 'primary' | 'success' | 'accent' | 'error';
export type ProgressBarHeight = 'xs' | 'sm' | 'md';

export interface ProgressBarProps {
  /** Current value (0 – max) */
  value: number;
  /** Maximum value; defaults to 100 */
  max?: number;
  /** Fill color — defaults to 'primary' */
  color?: ProgressBarColor;
  /** Accessible label for screen readers; defaults to 'Progreso' */
  label?: string;
  /** Bar height preset — defaults to 'sm' */
  height?: ProgressBarHeight;
  /** Extra Tailwind classes on the track container */
  className?: string;
}

const COLOR: Record<ProgressBarColor, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  accent:  'bg-accent',
  error:   'bg-error',
};

const HEIGHT: Record<ProgressBarHeight, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
};

/**
 * NORA Design System — ProgressBar.
 * Smooth animated fill with motion-reduce support.
 * Implements the WAI-ARIA progressbar role.
 */
export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  label = 'Progreso',
  height = 'sm',
  className = '',
}: ProgressBarProps) {
  const clamped = max === 0 ? 0 : Math.min(Math.max(value, 0), max);
  const pct = max === 0 ? 0 : (clamped / max) * 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={[
        'w-full rounded-full overflow-hidden bg-neutral-200',
        HEIGHT[height],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="ui-progressbar"
    >
      <div
        className={[
          'h-full rounded-full',
          /* Smooth fill animation; disabled when user prefers reduced motion */
          'transition-[width] duration-500 ease-out motion-reduce:transition-none',
          COLOR[color],
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default ProgressBar;
