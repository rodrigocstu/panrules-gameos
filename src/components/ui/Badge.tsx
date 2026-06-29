import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';

export interface BadgeProps {
  children: ReactNode;
  /** Color / semantic variant — defaults to 'default' */
  variant?: BadgeVariant;
  /** Extra Tailwind classes */
  className?: string;
}

const VARIANT: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary/10 text-primary-dark',
  success: 'bg-success/10 text-success-dark',
  error:   'bg-error/10   text-error-dark',
  warning: 'bg-accent/10  text-accent-dark',
  info:    'bg-primary/10 text-primary',
};

/**
 * NORA Design System — Badge.
 * Inline pill label for status indicators, categories, or counts.
 * Purely presentational — no internal state.
 */
export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full',
        'text-mobile-xs font-medium leading-none',
        VARIANT[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="ui-badge"
    >
      {children}
    </span>
  );
}

export default Badge;
