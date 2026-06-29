// Decisión del gate de la raíz (EGC-10, AC#4).
//
// Función pura que decide QUÉ árbol renderizar según el estado de sesión, ANTES de montar
// cualquier contenido protegido. Mientras `loading` se muestra un splash neutro; sin sesión
// (o sin calibración) se muestra el onboarding; sólo con sesión + calibración completa se
// monta la app. Como ninguna ruta protegida puede alcanzar `'app'` sin sesión, el contenido
// gated nunca se renderiza para un usuario no autenticado (redirect lógico a /auth).
export type GateDecision = 'splash' | 'onboarding' | 'app';

export interface GateInput {
  loading: boolean;
  isAuthenticated: boolean;
  calibrationDone: boolean;
  /** Ruta actual (de useHashRoute); informa la decisión pero no la relaja. */
  route: string;
}

export function resolveGate({ loading, isAuthenticated, calibrationDone }: GateInput): GateDecision {
  if (loading) return 'splash';
  if (!isAuthenticated) return 'onboarding';
  if (!calibrationDone) return 'onboarding';
  return 'app';
}
