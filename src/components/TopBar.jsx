import { Shield, Languages, Star, Flame, LayoutDashboard } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { navigateTo } from '../hooks/useHashRoute.js';

// Barra superior: marca del simulador + puntuación + selector de idioma + dispositivo.
export default function TopBar({ score = 0, streak = 0 }) {
  const { lang, setLang, t } = useI18n();
  const next = lang === 'es' ? 'en' : 'es';

  return (
    <div className="bg-slate-950 border-b border-slate-800 px-4 lg:px-6 py-3 flex justify-between items-center z-50">
      <div className="flex items-center gap-3">
        <div className="bg-orange-600 p-1.5 rounded text-white shrink-0">
          <Shield size={20} />
        </div>
        <div>
          <h1 className="font-bold text-base lg:text-lg text-slate-100 tracking-tight">
            PAN-OS <span className="text-orange-500">NGFW</span>{' '}
            <span className="hidden sm:inline">SIMULATOR</span>
          </h1>
          <div className="text-xs text-slate-500 font-mono">{t('top.console')}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 lg:gap-6 text-xs font-mono">
        {/* Puntuación + racha (T3.7) */}
        <div className="flex items-center gap-2" aria-label={t('score.aria', { score, streak })}>
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <Star size={14} aria-hidden="true" /> {score}
          </span>
          {streak > 1 && (
            <span className="flex items-center gap-1 text-orange-400 font-bold">
              <Flame size={14} aria-hidden="true" /> {streak}
            </span>
          )}
        </div>
        {/* Acceso a la Management Console (ruta '#/console'). */}
        <button
          type="button"
          onClick={() => navigateTo('console')}
          className="flex items-center gap-1.5 px-2 py-1 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-label={t('console.open')}
          title={t('console.open')}
        >
          <LayoutDashboard size={14} aria-hidden="true" />
          <span className="font-bold hidden sm:inline">{t('console.open')}</span>
        </button>
        {/* Selector de idioma (T3.6): cambia ES/EN sin recargar. */}
        <button
          type="button"
          onClick={() => setLang(next)}
          className="flex items-center gap-1.5 px-2 py-1 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-label={t('lang.switchTo')}
          title={t('lang.switchTo')}
        >
          <Languages size={14} aria-hidden="true" />
          <span className="font-bold">{t(`lang.${lang}`)}</span>
        </button>
        <div className="flex flex-col items-end">
          <span className="text-slate-500 hidden sm:block">{t('top.device')}</span>
          <span className="text-emerald-400">PA-3220-HQ</span>
        </div>
      </div>
    </div>
  );
}
