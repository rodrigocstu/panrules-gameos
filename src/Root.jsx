import { useEffect } from 'react';
import { useHashRoute, navigateTo, isProtectedRoute } from './hooks/useHashRoute.js';
import { useAuth } from './hooks/useAuth';
import { resolveGate } from './lib/authGate';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import FirewallNGFW from './App.jsx';
import Console from './pages/Console.jsx';
import WarRoom from './components/WarRoom.jsx';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import AppShell from './components/shell/AppShell';
import ProfileScreen from './components/shell/ProfileScreen';
import FirewallModule from './components/modules/firewall/FirewallModule';
import NatModule from './components/modules/nat/NatModule';
import { AvatarBubble } from './components/ui';

// Splash neutro mientras la sesión hidrata. NUNCA muestra contenido protegido (AC#4):
// el gate decide antes de montar la app.
function Splash() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-50"
    >
      <AvatarBubble size="xl" alt="Cargando" />
      <p className="text-mobile-base text-neutral-500">Cargando…</p>
    </div>
  );
}

// Raíz de la app. Sobre el switch de rutas existente (console/warroom/game) se añade el
// gate de autenticación (EGC-10): mientras carga la sesión muestra un splash; sin sesión o
// sin calibración completa muestra el onboarding; con sesión válida monta el AppShell con
// el juego. Las rutas protegidas (home/profile/calibration) redirigen a /auth cuando no hay
// sesión, antes del primer render del contenido gated (AC#4). Las rutas legacy
// console/warroom se preservan para usuarios autenticados.
export default function Root() {
  const [route] = useHashRoute();
  const auth = useAuth();
  const calibrationDone = auth.user?.calibrationDone ?? false;
  const gate = resolveGate({
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    calibrationDone,
    route,
  });

  // URL coherente: una ruta protegida visitada sin sesión fija el hash en /auth.
  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated && isProtectedRoute(route)) {
      navigateTo('auth');
    }
  }, [auth.loading, auth.isAuthenticated, route]);

  let content;
  if (gate === 'splash') {
    content = <Splash />;
  } else if (gate === 'onboarding') {
    content = <OnboardingFlow auth={auth} />;
  } else if (route === 'console') {
    content = <Console />;
  } else if (route === 'warroom') {
    content = <WarRoom />;
  } else if (route === 'profile') {
    content = (
      <AppShell route={route}>
        <ProfileScreen user={auth.user} onLogout={auth.logout} />
      </AppShell>
    );
  } else if (route === 'home') {
    // EGC-11: la home autenticada monta el módulo Firewall "El Portero". La ruta legacy
    // 'game' (else) conserva el simulador de escritorio FirewallNGFW.
    content = (
      <AppShell route={route}>
        <FirewallModule />
      </AppShell>
    );
  } else if (route === 'nat') {
    // EGC-12: el módulo NAT "La Centralita" (SNAT/DNAT/U-Turn).
    content = (
      <AppShell route={route}>
        <NatModule />
      </AppShell>
    );
  } else {
    content = (
      <AppShell route={route}>
        <FirewallNGFW />
      </AppShell>
    );
  }

  return <ErrorBoundary>{content}</ErrorBoundary>;
}
