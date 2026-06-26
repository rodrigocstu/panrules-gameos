import { useHashRoute } from './hooks/useHashRoute.js';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import FirewallNGFW from './App.jsx';
import Console from './pages/Console.jsx';

// Raíz de la app: decide qué pantalla mostrar según la ruta por hash.
//   '#/console' -> Management Console
//   resto       -> el juego (FirewallNGFW)
//
// Envuelve todo en ErrorBoundary para que un nivel malformado o un fallo de
// render no rompan la página entera (WBS 2.1).
export default function Root() {
  const [route] = useHashRoute();
  return <ErrorBoundary>{route === 'console' ? <Console /> : <FirewallNGFW />}</ErrorBoundary>;
}
