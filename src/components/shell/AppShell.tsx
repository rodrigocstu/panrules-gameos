// AppShell — chrome de la app autenticada (EGC-10, AC#3).
//
// Renderiza el contenido protegido con una cabecera que incluye `StreakCounter` (cableado
// a useStreak) y un `BottomNav` fijo. Como useStreak hidrata desde `localStorage` en el
// montaje sin tocar la red, al recargar offline el StreakCounter sigue mostrando el valor
// correcto (AC#3). AppShell asume usuario autenticado; el gate vive en Root (AC#4), así
// que nunca se monta para un usuario sin sesión.
import { useState, type ReactNode } from 'react';
import { BottomNav, StreakCounter, type BottomNavTab } from '../ui';
import { useStreak } from '../../hooks/useStreak';
import { useGlobalAvatarSituations } from '../../hooks/useGlobalAvatarSituations';
import { navigateTo } from '../../hooks/useHashRoute.js';
import { StreakFreezeModal } from '../streak/StreakFreezeModal';
import { AvatarIntervention } from '../avatar/AvatarIntervention';

export interface AppShellProps {
  children: ReactNode;
  /** Ruta activa (de useHashRoute) para resaltar la pestaña correcta. */
  route?: string;
}

function tabForRoute(route: string): BottomNavTab {
  return route === 'profile' ? 'perfil' : 'home';
}

export function AppShell({ children, route = 'home' }: AppShellProps) {
  // `useFreeze` se renombra a `applyFreeze` al desestructurar: un identificador con prefijo
  // `use` llamado dentro de un handler dispararía react-hooks/rules-of-hooks.
  const { streak, todayCheckedIn, isStreakBroken, freezeTokens, loading, useFreeze: applyFreeze } =
    useStreak();
  const currentStreak = streak?.currentStreak ?? 0;
  const [freezeDismissed, setFreezeDismissed] = useState(false);

  // Situaciones globales de NORA (EGC-17): reusa las señales ya desestructuradas de useStreak
  // (sin segunda suscripción) y monta AvatarIntervention como overlay global más abajo.
  const avatar = useGlobalAvatarSituations({
    streak,
    todayCheckedIn,
    isStreakBroken,
    freezeTokens,
    loading,
  });

  // Streak-Freeze visible en UI (AC#3): racha rota, sin check-in hoy, con tokens y no descartado.
  const offerFreeze = !todayCheckedIn && isStreakBroken && freezeTokens > 0 && !freezeDismissed;

  const handleTab = (tab: BottomNavTab): void => {
    if (tab === 'perfil') navigateTo('profile');
    else navigateTo('home');
  };

  const handleUseFreeze = (): void => {
    applyFreeze();
    avatar.onFreezeConsumed();
    setFreezeDismissed(true);
  };

  return (
    <div className="min-h-screen pb-16 bg-neutral-50">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-2 bg-white border-b border-neutral-200">
        <span className="font-bold text-primary">CiberSec Edugame</span>
        <StreakCounter count={currentStreak} active={currentStreak > 0} />
      </header>

      <main className="max-w-sm mx-auto">{children}</main>

      <BottomNav activeTab={tabForRoute(route)} onTabChange={handleTab} />

      {offerFreeze && (
        <StreakFreezeModal
          freezeTokens={freezeTokens}
          onUseFreeze={handleUseFreeze}
          onDismiss={() => setFreezeDismissed(true)}
        />
      )}

      <AvatarIntervention
        message={avatar.currentMessage}
        isVisible={avatar.isVisible}
        onDismiss={avatar.dismiss}
      />
    </div>
  );
}

export default AppShell;
