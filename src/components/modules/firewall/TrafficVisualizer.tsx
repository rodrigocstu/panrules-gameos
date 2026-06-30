// TrafficVisualizer — representación simplificada del flujo del paquete (EGC-11).
//
// No reproduce el SVG animado de App.jsx: es una franja horizontal zona → paquete →
// firewall → zona, de ~80 px de alto y 375 px de ancho. El color del paquete deriva del
// estado (allowed=success, blocked=error). Respeta `prefers-reduced-motion`. Marcada
// como una sola imagen accesible (role="img") con etiqueta que describe el estado.

export type TrafficStatus = 'idle' | 'animating' | 'allowed' | 'blocked';

const STATUS_LABEL: Record<TrafficStatus, string> = {
  idle: 'Tráfico en espera de evaluación',
  animating: 'Evaluando el tráfico',
  allowed: 'Tráfico permitido: el paquete cruzó el firewall',
  blocked: 'Tráfico bloqueado: el paquete no cruzó el firewall',
};

export interface TrafficVisualizerProps {
  srcZoneLabel: string;
  dstZoneLabel: string;
  status: TrafficStatus;
}

export function TrafficVisualizer({ srcZoneLabel, dstZoneLabel, status }: TrafficVisualizerProps) {
  const packetColor =
    status === 'allowed' ? 'bg-success' : status === 'blocked' ? 'bg-error' : 'bg-primary';

  return (
    <div
      role="img"
      aria-label={STATUS_LABEL[status]}
      data-testid="traffic-visualizer"
      data-status={status}
      className="flex h-20 w-full items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3"
    >
      <span className="shrink-0 rounded-md border border-neutral-300 bg-white px-2 py-1 text-mobile-xs font-medium text-neutral-700">
        {srcZoneLabel}
      </span>
      <span aria-hidden="true" className="h-0.5 flex-1 bg-neutral-300" />
      <span
        aria-hidden="true"
        className={[
          'h-3 w-3 shrink-0 rounded-full',
          packetColor,
          status === 'animating' ? 'motion-safe:animate-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
      <span
        aria-hidden="true"
        className="shrink-0 rounded-md bg-neutral-800 px-2 py-1 text-mobile-xs font-bold text-white"
      >
        FW
      </span>
      <span aria-hidden="true" className="h-0.5 flex-1 bg-neutral-300" />
      <span className="shrink-0 rounded-md border border-neutral-300 bg-white px-2 py-1 text-mobile-xs font-medium text-neutral-700">
        {dstZoneLabel}
      </span>
    </div>
  );
}

export default TrafficVisualizer;
