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
  return 'game';
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
