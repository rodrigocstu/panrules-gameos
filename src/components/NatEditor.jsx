import { ArrowRight } from 'lucide-react';

// Editor del NAT RULEBASE (T2.6) — una tabla SEPARADA de la Security Policy, tal
// como en PAN-OS real. El jugador elige el tipo de NAT y el editor muestra, con
// las IPs del nivel, qué se traduce (original -> translated) en cada dirección.
//
// `disabled` bloquea el select durante commit/animación (gameState !== 'idle').
const NAT_OPTIONS = [
  { id: 'NONE', label: 'No NAT' },
  { id: 'SNAT', label: 'Source NAT (SNAT)' },
  { id: 'DNAT', label: 'Destination NAT (DNAT)' },
  { id: 'DNAT+SNAT', label: 'U-Turn (DNAT+SNAT)' },
];

// Qué direcciones traduce cada tipo de NAT (para resaltar las filas relevantes).
const TRANSLATES = {
  NONE: { source: false, destination: false },
  SNAT: { source: true, destination: false },
  DNAT: { source: false, destination: true },
  'DNAT+SNAT': { source: true, destination: true },
};

export default function NatEditor({ level, natType, setNatType, disabled }) {
  const selectBase =
    'rounded p-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500';

  // Datos NAT del nivel (T2.6). Fallback defensivo si un nivel no los trae.
  const natData = level.nat ?? {
    source: { original: level.packet.srcIp, translated: level.packet.srcIp },
    destination: { original: level.packet.dstIp, translated: level.packet.dstIp },
  };
  const translates = TRANSLATES[natType] ?? TRANSLATES.NONE;

  // Una fila "original -> translated". Cuando el NAT activo no traduce esta
  // dirección, se muestra atenuada y el destino refleja la IP sin cambios.
  const TranslationRow = ({ dirLabel, original, translated, active }) => (
    <div
      className={`flex items-center gap-2 lg:gap-3 rounded-lg border px-3 py-2 transition-all ${
        active ? 'border-blue-700 bg-blue-950/30' : 'border-slate-800 bg-slate-900/40 opacity-60'
      }`}
    >
      <span className="w-20 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
        {dirLabel}
      </span>
      <span className="font-mono text-xs text-slate-300">{original}</span>
      <ArrowRight size={14} className={active ? 'text-blue-400' : 'text-slate-600'} />
      <span
        className={`font-mono text-xs font-bold ${active ? 'text-blue-300' : 'text-slate-500'}`}
      >
        {active ? translated : original}
      </span>
      {active && (
        <span className="ml-auto rounded bg-blue-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-400">
          translated
        </span>
      )}
    </div>
  );

  return (
    <div className="overflow-auto flex-1 bg-slate-900/50">
      <div className="p-4 min-w-[600px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-slate-500 font-bold uppercase border-b border-slate-700">
              <th className="p-2">Name</th>
              <th className="p-2">Original Packet</th>
              <th className="p-2 text-blue-400">NAT Type</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-800 text-xs border-l-4 border-blue-500 shadow-sm">
              <td className="p-2 font-mono text-slate-400">NAT-{level.id}</td>
              <td className="p-2 font-mono text-slate-400">
                {natData.source.original} {'->'} {natData.destination.original}
              </td>
              <td className="p-2">
                <select
                  value={natType}
                  onChange={(e) => setNatType(e.target.value)}
                  className={`bg-slate-900 border border-blue-900/50 text-blue-400 w-44 ${selectBase}`}
                  disabled={disabled}
                  aria-label="Tipo de NAT (NAT rulebase)"
                >
                  {NAT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Panel "Translated Packet": qué traduce el NAT elegido, con IPs del nivel */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            Translated Packet
          </div>
          <div className="flex flex-col gap-2">
            <TranslationRow
              dirLabel="Source"
              original={natData.source.original}
              translated={natData.source.translated}
              active={translates.source}
            />
            <TranslationRow
              dirLabel="Dest"
              original={natData.destination.original}
              translated={natData.destination.translated}
              active={translates.destination}
            />
          </div>
          {natType === 'NONE' && (
            <p className="mt-2 text-xs text-slate-500">
              Sin NAT: el paquete cruza el firewall con sus IPs originales.
            </p>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          En PAN-OS el <span className="text-blue-400">NAT Rulebase</span> es una tabla
          independiente de la Security Policy. Aquí defines la traducción de direcciones; la
          Security Policy evalúa las IPs originales (pre-NAT).
        </p>
      </div>
    </div>
  );
}
