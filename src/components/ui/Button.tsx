import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant — defaults to 'primary' */
  variant?: ButtonVariant;
  /** Size preset — defaults to 'md' */
  size?: ButtonSize;
  /** Shows a loading spinner and prevents interaction */
  loading?: boolean;
  children: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark ' +
    'focus-visible:ring-primary disabled:bg-primary/40 disabled:text-white/60',
  secondary:
    'bg-transparent border border-primary text-primary ' +
    'hover:bg-primary/10 active:bg-primary/20 ' +
    'focus-visible:ring-primary disabled:border-primary/30 disabled:text-primary/40',
  ghost:
    'bg-transparent text-neutral-700 ' +
    'hover:bg-neutral-100 active:bg-neutral-200 ' +
    'focus-visible:ring-neutral-400 disabled:text-neutral-400',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-mobile-sm min-h-touch rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-mobile-base min-h-touch rounded-lg gap-2',
  lg: 'px-6 py-3 text-mobile-lg min-h-touch-lg rounded-xl gap-2.5',
};

/**
 * NORA Design System — Button.
 * Presentational only — no business logic.
 * Variants: primary | secondary | ghost
 * Sizes: sm | md | lg
 * States: disabled | loading (disables interaction + shows spinner)
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-medium',
        'transition-colors duration-150 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="ui-button"
      {...rest}
    >
      {loading && (
        <Loader2 size={iconSize} className="animate-spin shrink-0" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export default Button;
