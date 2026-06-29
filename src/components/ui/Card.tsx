import type { ReactNode } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: ReactNode;
  /** Extra Tailwind classes applied to the root div */
  className?: string;
  /** Inner padding preset — defaults to 'md' */
  padding?: CardPadding;
  /**
   * ARIA role. When `aria-label` is set without an explicit role,
   * `role="region"` is applied automatically so the label is meaningful.
   */
  role?: string;
  /** Accessible label for the card's landmark region */
  'aria-label'?: string;
}

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
};

/**
 * NORA Design System — Card.
 * Elevated white container with consistent border, shadow and padding.
 * Purely presentational — no internal state.
 */
export function Card({
  children,
  className = '',
  padding = 'md',
  role,
  'aria-label': ariaLabel,
}: CardProps) {
  // A <div aria-label> without a role is invalid ARIA; auto-promote to region.
  const resolvedRole = role ?? (ariaLabel ? 'region' : undefined);

  return (
    <div
      role={resolvedRole}
      aria-label={ariaLabel}
      className={[
        'bg-white rounded-xl border border-neutral-200 shadow-sm',
        PADDING[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="ui-card"
    >
      {children}
    </div>
  );
}

export default Card;
