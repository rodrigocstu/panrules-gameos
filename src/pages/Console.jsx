import { useState } from 'react';
import { Shield, ArrowLeft, LayoutDashboard, Users, ListChecks, Wand2, Swords } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { navigateTo } from '../hooks/useHashRoute.js';
import ConsoleDashboard from '../components/console/ConsoleDashboard.jsx';
import StudentList from '../components/console/StudentList.jsx';
import LevelCatalog from '../components/console/LevelCatalog.jsx';
import LevelBuilder from '../components/console/LevelBuilder.jsx';

// Vistas de la consola. Cada entrada: id, icono, clave i18n y componente.
const VIEWS = [
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'console.nav.dashboard', Component: ConsoleDashboard },
  { id: 'students', icon: Users, labelKey: 'console.nav.students', Component: StudentList },
  { id: 'catalog', icon: ListChecks, labelKey: 'console.nav.catalog', Component: LevelCatalog },
  { id: 'builder', icon: Wand2, labelKey: 'console.nav.builder', Component: LevelBuilder },
];

/**
 * Console — shell de pantalla completa de la Management Console ('#/console').
 * Conmuta entre Dashboard, Alumnos (cohorts), Catálogo de niveles y Level Builder.
 */
export default function Console() {
  const { t } = useI18n();
  const [view, setView] = useState('dashboard');

  const active = VIEWS.find((v) => v.id === view) ?? VIEWS[0];
  const ActiveComponent = active.Component;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
      {/* Barra superior de la consola */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-1.5 rounded text-white shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="font-bold text-base lg:text-lg text-slate-100 tracking-tight">
              {t('console.title')}
            </h1>
            <div className="text-xs text-slate-500 font-mono">PA-3220-HQ · panrules-gameos</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('game')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <ArrowLeft size={14} aria-hidden="true" /> {t('console.back')}
        </button>
      </header>

      {/* Cuerpo: nav lateral + contenido */}
      <div className="flex-1 flex overflow-hidden">
        {/* Nav lateral de la consola */}
        <nav className="w-48 bg-slate-900 border-r border-slate-800 py-4 px-2 shrink-0 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            {t('console.title')}
          </div>
          {VIEWS.map(({ id, icon: Icon, labelKey }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-current={view === id ? 'page' : undefined}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                view === id
                  ? 'text-slate-200 bg-slate-800 border-l-2 border-orange-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={14} aria-hidden="true" /> {t(labelKey)}
            </button>
          ))}
          {/* Lanzador del War Room (pantalla completa, ruta aparte) */}
          <button
            type="button"
            onClick={() => navigateTo('warroom')}
            className="flex items-center gap-2 w-full text-left px-3 py-2 mt-2 rounded text-xs text-slate-400 hover:text-orange-300 hover:bg-slate-800/50 border-t border-slate-800 pt-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Swords size={14} aria-hidden="true" /> {t('warroom.title')}
          </button>
        </nav>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
