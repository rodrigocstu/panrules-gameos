import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShadowBanner } from './ShadowBanner';
import type { ShadowReport } from '../../../types/domain';

describe('ShadowBanner', () => {
  it('con shadowReports=[] mantiene la región aria-live pero NO renderiza contenido de alerta', () => {
    render(<ShadowBanner shadowReports={[]} />);
    // La región viva sigue montada (para anunciar la aparición/desaparición del conflicto).
    expect(screen.getByTestId('shadow-banner-live-region')).toBeInTheDocument();
    // Sin reportes no hay alerta visible.
    expect(screen.queryByTestId('shadow-banner')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('con un reporte renderiza una alerta nombrando regla sombreada/sombreadora y el motivo', () => {
    const reports: ShadowReport[] = [
      { shadowedRuleId: 'rule-solution', shadowingRuleId: 'rule-broad', reason: 'deny-before-allow' },
    ];
    render(
      <ShadowBanner
        shadowReports={reports}
        ruleLabel={(id) => (id === 'rule-broad' ? 'Regla 1' : 'Regla 2')}
      />
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    // Nombra ambas reglas (sombreada y sombreadora) por su etiqueta legible.
    expect(alert).toHaveTextContent('Regla 1');
    expect(alert).toHaveTextContent('Regla 2');
    // Comunica el motivo en texto (no solo color): el patrón deny-before-allow.
    expect(alert).toHaveTextContent(/DENY anterior/i);
  });

  it('describe cada reason en texto legible (superset-source)', () => {
    const reports: ShadowReport[] = [
      { shadowedRuleId: 'r2', shadowingRuleId: 'r1', reason: 'superset-source' },
    ];
    render(<ShadowBanner shadowReports={reports} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/zona de origen 'any'/i);
  });

  it('lista todos los reportes cuando hay varios', () => {
    const reports: ShadowReport[] = [
      { shadowedRuleId: 'r2', shadowingRuleId: 'r1', reason: 'superset-source' },
      { shadowedRuleId: 'r3', shadowingRuleId: 'r1', reason: 'superset-app' },
    ];
    render(<ShadowBanner shadowReports={reports} />);
    expect(screen.getByRole('alert')).toHaveTextContent('2 reglas sombreadas');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
