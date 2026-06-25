import { GraduationCap } from 'lucide-react';

// ExplanationPanel — microlección del "por qué" (T2.7).
//
// Renderiza la explicación pedagógica del escenario bajo el veredicto del
// resultado, tanto en acierto como en fallo. El texto se resuelve fuera (con
// resolveExplanation(level, reasonCode)) y se pasa ya elegido como `text`, para
// mantener el componente como presentación pura.
//
// Accesibilidad: es una región con etiqueta ("Por qué") para que los lectores de
// pantalla la anuncien como un bloque pedagógico distinto del veredicto. El icono
// es decorativo (aria-hidden).
export default function ExplanationPanel({ text, title = 'Por qué' }) {
  if (!text) return null;

  return (
    <section
      aria-label={title}
      className="mt-2 mb-6 text-left bg-slate-900/70 border border-slate-700 rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap size={16} className="text-amber-400 shrink-0" aria-hidden="true" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">{title}</h4>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
    </section>
  );
}
