// Barra arrastrable para redimensionar paneles del dashboard.
export default function ResizeHandle({ axis, onMouseDown }) {
  return (
    <div
      role="separator"
      aria-hidden="true"
      onMouseDown={onMouseDown}
      className={`shrink-0 bg-slate-700 hover:bg-orange-500 active:bg-orange-500 motion-safe:transition-colors z-10 select-none ${
        axis === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'
      }`}
    />
  );
}
