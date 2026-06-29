// AvatarIntervention — burbuja overlay de NORA (EGC-11, Screen 10 / 15).
//
// Región aria-live="polite" siempre montada (anuncios de lector de pantalla). La burbuja
// se fija sobre el BottomNav (`bottom-20`), entra con una transición suave que respeta
// `prefers-reduced-motion`, y se descarta al tocarla. Sólo primitivos del Design System.

import { useEffect, useState } from 'react';
import { AvatarBubble } from '../ui';

export interface AvatarInterventionProps {
  message: string | null;
  isVisible: boolean;
  onDismiss: () => void;
}

export function AvatarIntervention({ message, isVisible, onDismiss }: AvatarInterventionProps) {
  const open = isVisible && message !== null && message !== '';
  const [entered, setEntered] = useState(false);

  // Dispara la transición de entrada tras el montaje; desactivada con reduced-motion.
  useEffect(() => {
    setEntered(open);
  }, [open]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      data-testid="avatar-live-region"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4"
    >
      {open && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Mensaje de NORA. Tocar para cerrar."
          data-testid="avatar-intervention"
          className={[
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 text-left',
            'rounded-xl border border-neutral-200 bg-white p-3 shadow-lg',
            'transition duration-200 ease-out motion-reduce:transition-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          ].join(' ')}
        >
          <AvatarBubble size="sm" />
          <span className="text-mobile-sm leading-snug text-neutral-700">{message}</span>
        </button>
      )}
    </div>
  );
}

export default AvatarIntervention;
