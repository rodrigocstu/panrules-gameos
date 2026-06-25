import { Search } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y.js';
import { useI18n } from '../i18n/I18nContext.jsx';

const TITLE_ID = 'log-modal-title';

// Modal de detalle de un registro de tráfico. Devuelve null si no hay log.
export default function LogModal({ log, onClose }) {
  const { t } = useI18n();
  const isOpen = !!log;
  const { containerRef } = useModalA11y(isOpen, onClose);

  if (!log) return null;

  return (
    <div
      className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
    >
      <div
        ref={containerRef}
        className="bg-slate-800 rounded-lg shadow-2xl border border-slate-600 w-full max-w-2xl overflow-hidden"
        tabIndex={-1}
      >
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 id={TITLE_ID} className="font-bold text-white flex items-center gap-2">
            <Search size={18} className="text-orange-500" /> {t('log.detail.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded px-2 py-1"
            aria-label={t('log.aria.close')}
          >
            {t('log.detail.close')}
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6 text-sm font-mono">
          <div className="space-y-2">
            <div className="text-slate-500 text-xs uppercase">{t('log.detail.source')}</div>
            <div className="text-emerald-400 text-lg">{log.src}</div>
          </div>
          <div className="space-y-2">
            <div className="text-slate-500 text-xs uppercase">{t('log.detail.destination')}</div>
            <div className="text-blue-400 text-lg">{log.dst}</div>
          </div>
          <div className="col-span-2 border-t border-slate-700 pt-4 space-y-2">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-slate-500 text-xs">{t('log.col.app')}</div>
                <div className="text-purple-400">{log.app}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">{t('log.col.action')}</div>
                <div className={log.action === 'ALLOW' ? 'text-green-500' : 'text-red-500'}>
                  {log.action}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">{t('log.detail.bytes')}</div>
                <div className="text-white">{log.bytes}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">{t('log.detail.flags')}</div>
                <div className="text-white">{log.flags}</div>
              </div>
            </div>
          </div>
          <div className="col-span-2 bg-black/30 p-3 rounded border border-slate-700">
            <div className="text-slate-500 text-xs mb-1">{t('log.detail.reason')}</div>
            <div className="text-orange-300">{log.reason}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
