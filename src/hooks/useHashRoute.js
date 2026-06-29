import { useState, useEffect, useCallback } from 'react';

// Mini-router por hash, sin dependencias externas (consistente con la filosofía
// del proyecto: no añadir una dep por algo de pocas líneas).
//
// Rutas reconocidas:
//   '#/console'  -> 'console'  (Management Console)
//   cualquier otra (incl. vacío, '#/', '#/?level=3') -> 'game'
//
// Mantener el routing por hash NO cambia el base path de Vite ('/panrules-gameos/'),
// por lo que sigue funcionando en GitHub Pages sin configuración de servidor.

export function parseRoute(hash) {
  const clean = (hash || '').replace(/^#\/?/, '').split('?')[0];
  if (clean === 'console') return 'console';
  if (clean === 'warroom') return 'warroom';
  if (clean === 'auth') return 'auth';
  if (clean === 'calibration') return 'calibration';
  if (clean === 'home') return 'home';
  if (clean === 'profile') return 'profile';
  if (clean === 'nat') return 'nat';
  if (clean === 'policy') return 'policy';
  return 'game';
}

// Rutas que exigen sesión iniciada. El acceso sin auth se redirige a 'auth' (AC#4 EGC-10).
// 'nat' (módulo La Centralita, EGC-12) y 'policy' (módulo Políticas de Red, EGC-18) son
// contenido protegido como 'home'. Ruta en inglés por consistencia con home/nat.
const PROTECTED_ROUTES = new Set(['home', 'profile', 'calibration', 'nat', 'policy']);

/** ¿La ruta requiere usuario autenticado? */
export function isProtectedRoute(route) {
  return PROTECTED_ROUTES.has(route);
}

/** ¿Es la ruta de autenticación (login/registro)? */
export function isAuthRoute(route) {
  return route === 'auth';
}

/** ¿La ruta forma parte del onboarding (auth o calibración)? */
export function isOnboarding(route) {
  return route === 'auth' || route === 'calibration';
}

export function navigateTo(name) {
  if (typeof window === 'undefined') return;
  window.location.hash = name === 'game' ? '#/' : `#/${name}`;
}

export function useHashRoute() {
  const [route, setRoute] = useState(() =>
    typeof window === 'undefined' ? 'game' : parseRoute(window.location.hash)
  );

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((name) => navigateTo(name), []);

  return [route, navigate];
}
