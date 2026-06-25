import { useState } from 'react';
import { ZONES, APPS, SERVICES, PROFILES } from '../data/constants';
import { useI18n } from '../i18n/I18nContext.jsx';
import NatEditor from './NatEditor.jsx';

// Editor de políticas: dos rulebases en pestañas, como en PAN-OS real (T2.6).
//  - "Security Policy": la fila editable de la regla de seguridad (SIN NAT).
//  - "NAT": el NAT rulebase, una tabla aparte (componente NatEditor).
// La pestaña activa se gestiona como estado local; ambas son funcionales.
// `disabled` bloquea los campos durante commit/animación (gameState !== 'idle').
export default function PolicyEditor({
  level,
  ruleName,
  setRuleName,
  srcZone,
  setSrcZone,
  dstZone,
  setDstZone,
  app,
  setApp,
  service,
  setService,
  action,
  setAction,
  profile,
  setProfile,
  natType,
  setNatType,
  disabled,
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('security');
  const selectBase =
    'rounded p-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500';

  // Clases de pestaña: activa (subrayada) vs. inactiva (clicable).
  const tabClass = (id, accent) =>
    activeTab === id
      ? `px-4 py-3 text-xs font-bold ${accent} border-b-2 ${
          id === 'security' ? 'border-orange-500' : 'border-blue-500'
        } bg-slate-800/50`
      : 'px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors';

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 flex px-4 shadow-md z-10">
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={tabClass('security', 'text-orange-500')}
          aria-pressed={activeTab === 'security'}
        >
          {t('editor.tab.security')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nat')}
          className={tabClass('nat', 'text-blue-400')}
          aria-pressed={activeTab === 'nat'}
        >
          {t('editor.tab.nat')}
        </button>
      </div>

      {activeTab === 'nat' ? (
        <NatEditor level={level} natType={natType} setNatType={setNatType} disabled={disabled} />
      ) : (
        /* Wrapper con scroll horizontal en móvil para no romper la tabla */
        <div className="overflow-auto flex-1 bg-slate-900/50 relative">
          <div className="p-4 min-w-[600px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-slate-500 font-bold uppercase border-b border-slate-700">
                  <th className="p-2">{t('editor.col.name')}</th>
                  <th className="p-2">{t('editor.col.source')}</th>
                  <th className="p-2">{t('editor.col.dest')}</th>
                  <th className="p-2">{t('editor.col.app')}</th>
                  <th className="p-2">{t('editor.col.service')}</th>
                  <th className="p-2">{t('editor.col.action')}</th>
                  <th className="p-2 text-orange-400">{t('editor.col.profile')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-800 text-xs border-l-4 border-orange-500 shadow-sm">
                  <td className="p-2">
                    <input
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      className="bg-transparent text-white w-20 focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 rounded"
                      aria-label={t('editor.aria.ruleName')}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={srcZone}
                      onChange={(e) => setSrcZone(e.target.value)}
                      className={`bg-slate-900 border border-slate-600 w-20 text-emerald-400 ${selectBase}`}
                      disabled={disabled}
                      aria-label={t('editor.aria.srcZone')}
                    >
                      {Object.values(ZONES).map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={dstZone}
                      onChange={(e) => setDstZone(e.target.value)}
                      className={`bg-slate-900 border border-slate-600 w-20 text-blue-400 ${selectBase}`}
                      disabled={disabled}
                      aria-label={t('editor.aria.dstZone')}
                    >
                      {Object.values(ZONES).map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={app}
                      onChange={(e) => setApp(e.target.value)}
                      className={`bg-slate-900 border border-slate-600 w-20 ${selectBase}`}
                      disabled={disabled}
                      aria-label={t('editor.aria.app')}
                    >
                      {APPS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className={`bg-slate-900 border border-slate-600 w-24 ${selectBase}`}
                      disabled={disabled}
                      aria-label={t('editor.aria.service')}
                    >
                      {SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className={`border w-16 font-bold ${action === 'ALLOW' ? 'bg-emerald-900 border-emerald-700 text-emerald-400' : 'bg-red-900 border-red-700 text-red-400'} ${selectBase}`}
                      disabled={disabled}
                      aria-label={t('editor.aria.action')}
                    >
                      <option value="ALLOW">{t('editor.action.allow')}</option>
                      <option value="DENY">{t('editor.action.deny')}</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={profile}
                      onChange={(e) => setProfile(e.target.value)}
                      className={`bg-slate-900 border border-orange-900/50 text-orange-400 w-20 ${selectBase}`}
                      disabled={disabled}
                      aria-label={t('editor.aria.profile')}
                    >
                      {PROFILES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
