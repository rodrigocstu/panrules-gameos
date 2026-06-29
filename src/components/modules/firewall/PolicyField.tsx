// PolicyField — un campo configurable del editor de políticas móvil (EGC-11, Screen 07).
//
// Layout apilado: label arriba, grupo de opciones abajo. Cada opción es un botón con
// área táctil ≥44 px (`min-h-touch`), `primary` cuando está seleccionada / `neutral`
// cuando no. Presentacional puro; el estado lo gobierna useFirewallModule.

import { useId } from 'react';

export interface PolicyFieldOption {
  id: string;
  label: string;
}

export interface PolicyFieldProps {
  label: string;
  value: string;
  options: PolicyFieldOption[];
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function PolicyField({ label, value, options, onChange, disabled = false }: PolicyFieldProps) {
  const labelId = useId();

  return (
    <div className="w-full">
      <p id={labelId} className="mb-1.5 text-mobile-sm font-medium text-neutral-700">
        {label}
      </p>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(opt.id)}
              className={[
                'min-h-touch rounded-lg px-3 py-2 text-mobile-sm font-medium',
                'transition-colors focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-primary focus-visible:ring-offset-1',
                'disabled:cursor-not-allowed disabled:opacity-50',
                selected
                  ? 'bg-primary text-white'
                  : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PolicyField;
