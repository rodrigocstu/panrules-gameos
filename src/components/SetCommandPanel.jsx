import { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { buildSetCommands } from '../lib/setCommand.js';

// Puente a PAN-OS real (T3.4): al acertar, muestra el comando `set` equivalente
// a la política creada, con los rulebases Security y NAT separados. Incluye un
// botón de copiar y la advertencia de validar contra la versión propia.
export default function SetCommandPanel({ level, ruleName }) {
  const [copied, setCopied] = useState(false);
  if (!level) return null;

  const { security, nat } = buildSetCommands(level, ruleName);
  const allLines = [...security, ...nat];
  if (allLines.length === 0) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(allLines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard no disponible: ignorar silenciosamente (no romper la UI).
    }
  };

  return (
    <section
      aria-label="Comando set equivalente en PAN-OS"
      className="mb-4 text-left bg-slate-950/70 border border-slate-700 rounded-lg overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-700">
        <span className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
          <Terminal size={13} aria-hidden="true" /> Comando set (PAN-OS)
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded px-1.5 py-0.5"
          aria-label="Copiar comandos set al portapapeles"
        >
          {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="px-3 py-2 text-xs leading-relaxed text-emerald-300 font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
        {security.length > 0 && (
          <>
            <span className="text-slate-500"># Security rulebase</span>
            {'\n'}
            {security.join('\n')}
          </>
        )}
        {nat.length > 0 && (
          <>
            {'\n\n'}
            <span className="text-slate-500"># NAT rulebase (tabla separada)</span>
            {'\n'}
            {nat.join('\n')}
          </>
        )}
      </pre>
      <p className="px-3 py-1.5 text-[11px] text-slate-500 border-t border-slate-800">
        Sintaxis orientativa: <strong>valida contra tu versión de PAN-OS</strong> (PAN-OS /
        Panorama).
      </p>
    </section>
  );
}
