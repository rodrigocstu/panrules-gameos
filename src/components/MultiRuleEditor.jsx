import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { ZONES, APPS } from '../data/constants';
import { detectShadowing } from '../lib/firewall-engine';
import { useI18n } from '../i18n/I18nContext.jsx';
import ShadowWarning from './ShadowWarning.jsx';

const MAX_RULES = 4;

// Regla vacía por defecto
function emptyRule(n) {
  return {
    id: `rule-${n}`,
    srcZone: 'trust',
    dstZone: 'untrust',
    app: 'any',
    service: 'application-default',
    action: 'ALLOW',
    nat: 'NONE',
    profile: 'none',
  };
}

/**
 * MultiRuleEditor — editor de múltiples reglas para niveles con level.multiRule === true.
 *
 * Solo se monta cuando level.multiRule === true. Para todos los demás niveles,
 * el flujo con PolicyEditor sigue exactamente igual.
 *
 * Props:
 *   rules      : PolicyRule[]          — estado externo de las reglas.
 *   setRules   : (rules) => void       — setter del estado externo.
 *   disabled   : boolean               — bloquea la edición durante la animación.
 */
export default function MultiRuleEditor({ rules, setRules, disabled }) {
  const { t } = useI18n();

  // Inicializar con 2 reglas si el estado externo está vacío
  useEffect(() => {
    if (!rules || rules.length === 0) {
      setRules([emptyRule(1), emptyRule(2)]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detectar shadowing en tiempo real
  const shadowReports = rules && rules.length >= 2 ? detectShadowing(rules) : [];

  const selectBase =
    'rounded p-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 bg-slate-900 border border-slate-600';

  // Mover regla arriba
  const moveUp = (idx) => {
    if (idx === 0) return;
    setRules((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  // Mover regla abajo
  const moveDown = (idx) => {
    setRules((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  // Actualizar un campo de una regla
  const updateRule = (idx, field, value) => {
    setRules((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // Añadir regla
  const addRule = () => {
    setRules((prev) => {
      if (prev.length >= MAX_RULES) return prev;
      return [...prev, emptyRule(prev.length + 1)];
    });
  };

  if (!rules || rules.length === 0) return null;

  return (
    <div className="flex flex-col flex-1 bg-slate-900/50">
      {/* Cabecera de pestañas (estética, para consistencia visual con PolicyEditor) */}
      <div className="bg-slate-900 border-b border-slate-800 flex px-4 shadow-md z-10">
        <div className="px-4 py-3 text-xs font-bold text-orange-500 border-b-2 border-orange-500 bg-slate-800/50">
          {t('editor.tab.security')} — Multi-Rule
        </div>
      </div>

      {/* Banner de shadowing */}
      <div className="pt-2">
        <ShadowWarning shadowReports={shadowReports} />
      </div>

      {/* Tabla de reglas */}
      <div className="overflow-auto flex-1 relative">
        <div className="p-4 min-w-[640px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-slate-500 font-bold uppercase border-b border-slate-700">
                <th className="p-2 w-8">#</th>
                <th className="p-2">{t('editor.col.source')}</th>
                <th className="p-2">{t('editor.col.dest')}</th>
                <th className="p-2">{t('editor.col.app')}</th>
                <th className="p-2">{t('editor.col.action')}</th>
                <th className="p-2 w-16">Orden</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, idx) => {
                const isShadowed = shadowReports.some((r) => r.shadowedRuleId === rule.id);
                return (
                  <tr
                    key={rule.id}
                    className={`text-xs border-l-4 shadow-sm ${
                      isShadowed
                        ? 'bg-amber-950/20 border-amber-600 opacity-60'
                        : 'bg-slate-800 border-orange-500'
                    }`}
                  >
                    {/* Número de regla */}
                    <td className="p-2 text-slate-500 font-mono font-bold">{idx + 1}</td>

                    {/* Zona origen */}
                    <td className="p-2">
                      <select
                        value={rule.srcZone}
                        onChange={(e) => updateRule(idx, 'srcZone', e.target.value)}
                        className={`${selectBase} w-20 text-emerald-400`}
                        disabled={disabled}
                        aria-label={`${t('multirule.rule', { n: idx + 1 })} ${t('editor.aria.srcZone')}`}
                      >
                        {Object.values(ZONES).map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Zona destino */}
                    <td className="p-2">
                      <select
                        value={rule.dstZone}
                        onChange={(e) => updateRule(idx, 'dstZone', e.target.value)}
                        className={`${selectBase} w-20 text-blue-400`}
                        disabled={disabled}
                        aria-label={`${t('multirule.rule', { n: idx + 1 })} ${t('editor.aria.dstZone')}`}
                      >
                        {Object.values(ZONES).map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* App */}
                    <td className="p-2">
                      <select
                        value={rule.app}
                        onChange={(e) => updateRule(idx, 'app', e.target.value)}
                        className={`${selectBase} w-24`}
                        disabled={disabled}
                        aria-label={`${t('multirule.rule', { n: idx + 1 })} ${t('editor.aria.app')}`}
                      >
                        {APPS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Acción */}
                    <td className="p-2">
                      <select
                        value={rule.action}
                        onChange={(e) => updateRule(idx, 'action', e.target.value)}
                        className={`border w-16 font-bold rounded p-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                          rule.action === 'ALLOW'
                            ? 'bg-emerald-900 border-emerald-700 text-emerald-400'
                            : 'bg-red-900 border-red-700 text-red-400'
                        }`}
                        disabled={disabled}
                        aria-label={`${t('multirule.rule', { n: idx + 1 })} ${t('editor.aria.action')}`}
                      >
                        <option value="ALLOW">{t('editor.action.allow')}</option>
                        <option value="DENY">{t('editor.action.deny')}</option>
                      </select>
                    </td>

                    {/* Botones de orden */}
                    <td className="p-2">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveUp(idx)}
                          disabled={disabled || idx === 0}
                          className="p-0.5 rounded text-slate-400 hover:text-white disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                          aria-label={`Subir ${t('multirule.rule', { n: idx + 1 })}`}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(idx)}
                          disabled={disabled || idx === rules.length - 1}
                          className="p-0.5 rounded text-slate-400 hover:text-white disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                          aria-label={`Bajar ${t('multirule.rule', { n: idx + 1 })}`}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Botón añadir regla */}
          {rules.length < MAX_RULES && (
            <button
              type="button"
              onClick={addRule}
              disabled={disabled}
              className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-40"
            >
              <Plus size={14} />
              {t('multirule.add')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
