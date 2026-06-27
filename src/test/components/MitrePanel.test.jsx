import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import MitrePanel from '../../components/MitrePanel.jsx';
import { renderWithI18n } from '../test-utils.jsx';

describe('MitrePanel — niveles sin mapeo', () => {
  it('no renderiza nada para un nivel sin técnicas', () => {
    const { container } = renderWithI18n(<MitrePanel levelId={999} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('MitrePanel — niveles con mapeo', () => {
  it('muestra el TID y nombre de la técnica (L5)', () => {
    renderWithI18n(<MitrePanel levelId={5} />);
    expect(screen.getByText(/T1048/)).toBeInTheDocument();
    expect(screen.getByText(/Exfiltration Over Alternative Protocol/)).toBeInTheDocument();
  });

  it('el enlace apunta a attack.mitre.org', () => {
    renderWithI18n(<MitrePanel levelId={5} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://attack.mitre.org/techniques/T1048/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('muestra el título del panel MITRE', () => {
    renderWithI18n(<MitrePanel levelId={24} />);
    expect(screen.getByText(/MITRE ATT&CK/)).toBeInTheDocument();
  });

  it('muestra la táctica de la técnica', () => {
    renderWithI18n(<MitrePanel levelId={5} />);
    expect(screen.getByText('Exfiltration')).toBeInTheDocument();
  });
});
