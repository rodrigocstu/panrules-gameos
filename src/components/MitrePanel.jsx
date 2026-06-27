import { Crosshair, ExternalLink } from 'lucide-react';
import { useI18n, pickText } from '../i18n/I18nContext.jsx';
import { mitreFor } from '../data/mitre-map';

/**
 * MitrePanel — MITRE ATT&CK Scenario Mapper (concepto disruptivo 5.2).
 *
 * Se muestra en ResultOverlay al ganar: indica qué técnica ofensiva de MITRE
 * ATT&CK acaba de bloquear el control PAN-OS configurado. Datos estáticos.
 * Si el nivel no tiene mapeo, no renderiza nada.
 *
 * Props:
 *   levelId : id del nivel resuelto
 */
export default function MitrePanel({ levelId }) {
  const { lang, t } = useI18n();
  const techniques = mitreFor(levelId);
  if (techniques.length === 0) return null;

  return (
    <div className="mt-3 text-left bg-slate-900/70 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Crosshair size={15} className="text-red-400" aria-hidden="true" />
        <span className="text-xs font-bold text-red-400">{t('mitre.title')}</span>
      </div>
      <ul className="space-y-2">
        {techniques.map((tech) => (
          <li key={tech.techniqueId}>
            <a
              href={tech.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono font-bold text-red-300 hover:text-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              {tech.techniqueId} · {tech.techniqueName}
              <ExternalLink size={11} aria-hidden="true" />
            </a>
            <div className="text-[11px] text-slate-500 uppercase tracking-wide">
              {tech.tactic}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              {pickText(tech.blurb, lang)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
