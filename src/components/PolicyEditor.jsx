import { ZONES, APPS, SERVICES, PROFILES } from '../data/constants.js';

// Editor de la regla de Security Policy: pestañas + una fila editable.
// `disabled` bloquea los campos durante commit/animación (gameState !== 'idle').
//
// NOTA: la pestaña "NAT" hoy es inerte y el NAT se edita en la misma fila de
// Security (bug #6 / T2.6). Se separa en WP-3; aquí solo se reubica el JSX.
export default function PolicyEditor({
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
  const selectBase =
    'rounded p-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500';

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 flex px-4 shadow-md z-10">
        <div className="px-4 py-3 text-xs font-bold text-orange-500 border-b-2 border-orange-500 bg-slate-800/50">
          Security Policy
        </div>
        <div className="px-4 py-3 text-xs font-bold text-slate-500">NAT</div>
      </div>

      {/* Wrapper con scroll horizontal en móvil para no romper la tabla */}
      <div className="overflow-auto flex-1 bg-slate-900/50 relative">
        <div className="p-4 min-w-[600px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-slate-500 font-bold uppercase border-b border-slate-700">
                <th className="p-2">Name</th>
                <th className="p-2">Source</th>
                <th className="p-2">Dest</th>
                <th className="p-2">App</th>
                <th className="p-2">Service</th>
                <th className="p-2">Action</th>
                <th className="p-2 text-orange-400">Profile</th>
                <th className="p-2 text-blue-400">NAT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-800 text-xs border-l-4 border-orange-500 shadow-sm">
                <td className="p-2">
                  <input
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="bg-transparent text-white w-20 focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 rounded"
                    aria-label="Nombre de la regla"
                  />
                </td>
                <td className="p-2">
                  <select
                    value={srcZone}
                    onChange={(e) => setSrcZone(e.target.value)}
                    className={`bg-slate-900 border border-slate-600 w-20 text-emerald-400 ${selectBase}`}
                    disabled={disabled}
                    aria-label="Zona origen"
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
                    aria-label="Zona destino"
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
                    aria-label="Aplicación"
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
                    aria-label="Servicio"
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
                    aria-label="Acción"
                  >
                    <option value="ALLOW">Allow</option>
                    <option value="DENY">Deny</option>
                  </select>
                </td>
                <td className="p-2">
                  <select
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                    className={`bg-slate-900 border border-orange-900/50 text-orange-400 w-20 ${selectBase}`}
                    disabled={disabled}
                    aria-label="Perfil de seguridad"
                  >
                    {PROFILES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <select
                    value={natType}
                    onChange={(e) => setNatType(e.target.value)}
                    className={`bg-slate-900 border border-blue-900/50 text-blue-400 w-20 ${selectBase}`}
                    disabled={disabled}
                    aria-label="Tipo de NAT"
                  >
                    <option value="NONE">None</option>
                    <option value="SNAT">SNAT</option>
                    <option value="DNAT">DNAT</option>
                    <option value="DNAT+SNAT">U-Turn</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
