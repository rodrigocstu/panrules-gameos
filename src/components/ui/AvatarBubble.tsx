export type AvatarBubbleSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarBubbleProps {
  /**
   * Image URL. When absent, renders the static NORA "N" gradient placeholder.
   * Ready to swap in a real avatar image without prop changes.
   */
  src?: string;
  /** Accessible alt text — defaults to 'NORA' */
  alt?: string;
  /** Size preset — defaults to 'md' */
  size?: AvatarBubbleSize;
  /** Extra Tailwind classes on the root element */
  className?: string;
}

const SIZE: Record<AvatarBubbleSize, { container: string; text: string }> = {
  sm: { container: 'w-8 h-8',   text: 'text-sm' },
  md: { container: 'w-12 h-12', text: 'text-mobile-lg' },
  lg: { container: 'w-16 h-16', text: 'text-2xl' },
  xl: { container: 'w-24 h-24', text: 'text-4xl' },
};

/**
 * NORA Design System — AvatarBubble.
 * Static placeholder for the NORA mentor avatar.
 * When `src` is provided renders an <img>; otherwise shows a gradient "N" pill
 * (blue-to-violet, matching the NORA brand identity from tokens.css).
 */
export function AvatarBubble({
  src,
  alt = 'NORA',
  size = 'md',
  className = '',
}: AvatarBubbleProps) {
  const { container, text } = SIZE[size];

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={[
          container,
          'rounded-full object-cover shrink-0 border-2 border-primary/20',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        data-testid="ui-avatar-bubble"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={[
        container,
        'rounded-full shrink-0 flex items-center justify-center',
        'font-bold text-white select-none',
        text,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
      data-testid="ui-avatar-bubble"
    >
      N
    </div>
  );
}

export default AvatarBubble;
