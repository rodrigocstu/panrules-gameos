import { describe, it, expect } from 'vitest';
import { screen, queryAllByRole } from '@testing-library/react';
import ShadowWarning from '../../components/ShadowWarning.jsx';
import { renderWithI18n } from '../test-utils.jsx';

const makeReport = (shadowingRuleId, shadowedRuleId, reason = 'superset-app') => ({
  shadowingRuleId,
  shadowedRuleId,
  reason,
});

describe('ShadowWarning — sin reportes', () => {
  it('no renderiza nada cuando shadowReports es undefined', () => {
    const { container } = renderWithI18n(<ShadowWarning shadowReports={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('no renderiza nada cuando shadowReports es array vacío', () => {
    const { container } = renderWithI18n(<ShadowWarning shadowReports={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('no hay role="alert" cuando no hay reportes', () => {
    const { container } = renderWithI18n(<ShadowWarning shadowReports={[]} />);
    expect(queryAllByRole(container, 'alert')).toHaveLength(0);
  });
});

describe('ShadowWarning — con reportes', () => {
  it('muestra role="alert" cuando hay al menos un reporte', () => {
    renderWithI18n(
      <ShadowWarning shadowReports={[makeReport('rule-1', 'rule-2')]} />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('muestra un párrafo por cada reporte', () => {
    const reports = [
      makeReport('rule-1', 'rule-2'),
      makeReport('rule-1', 'rule-3'),
    ];
    renderWithI18n(<ShadowWarning shadowReports={reports} />);
    const alert = screen.getByRole('alert');
    const paragraphs = alert.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
  });

  it('muestra un único párrafo para un único reporte', () => {
    renderWithI18n(
      <ShadowWarning shadowReports={[makeReport('rule-A', 'rule-B')]} />,
    );
    const alert = screen.getByRole('alert');
    expect(alert.querySelectorAll('p')).toHaveLength(1);
  });
});

describe('ShadowWarning — razones de shadowing', () => {
  it('renderiza sin errores con reason superset-source', () => {
    renderWithI18n(
      <ShadowWarning shadowReports={[makeReport('r1', 'r2', 'superset-source')]} />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renderiza sin errores con reason deny-before-allow', () => {
    renderWithI18n(
      <ShadowWarning shadowReports={[makeReport('r1', 'r2', 'deny-before-allow')]} />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
