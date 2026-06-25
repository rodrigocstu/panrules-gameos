import { Eye } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';

// Panel inferior de registros de tráfico. Cada fila abre el detalle (onSelectLog).
export default function TrafficLog({ logs, onSelectLog }) {
  const { t } = useI18n();
  return (
    <div className="h-32 bg-slate-950 border-t border-slate-800 flex flex-col">
      <div className="px-3 py-1 bg-slate-900 text-xs text-slate-400 font-bold border-b border-slate-800">
        {t('log.title')}
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-xs font-mono">
          <thead className="sticky top-0 bg-slate-950 text-slate-500">
            <tr>
              <th className="p-1">{t('log.col.time')}</th>
              <th className="p-1">{t('log.col.source')}</th>
              <th className="p-1">{t('log.col.dest')}</th>
              <th className="p-1">{t('log.col.app')}</th>
              <th className="p-1">{t('log.col.action')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => onSelectLog(log)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectLog(log);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Log: ${log.src} → ${log.dst} ${log.app} ${log.action}`}
                className="border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
              >
                <td className="p-1 text-slate-500 group-hover:text-white">{log.time}</td>
                <td className="p-1 text-emerald-400">{log.src}</td>
                <td className="p-1 text-blue-400">{log.dst}</td>
                <td className="p-1 text-purple-400 flex items-center gap-1">{log.app}</td>
                <td
                  className={`p-1 font-bold ${log.action === 'ALLOW' ? 'text-green-500' : 'text-red-500'}`}
                >
                  {log.action}{' '}
                  <Eye size={8} className="inline ml-1 opacity-0 group-hover:opacity-100" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
