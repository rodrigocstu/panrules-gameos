import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import PolicyTutor from '../../components/PolicyTutor.jsx';
import { renderWithI18n } from '../test-utils.jsx';

const level = {
  id: 1,
  solution: {
    srcZone: 'trust',
    dstZone: 'untrust',
    app: 'ssl',
    service: 'application-default',
    action: 'ALLOW',
    nat: 'SNAT',
    profile: 'default',
  },
};

describe('PolicyTutor — guardas', () => {
  it('no renderiza sin config', () => {
    const { container } = renderWithI18n(<PolicyTutor level={level} config={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('no renderiza sin level', () => {
    const { container } = renderWithI18n(<PolicyTutor level={null} config={{}} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('PolicyTutor — análisis offline', () => {
  it('muestra el título del tutor', () => {
    renderWithI18n(<PolicyTutor level={level} config={{ ...level.solution, app: 'any' }} />);
    expect(screen.getByText(/tutor de pol/i)).toBeInTheDocument();
  });

  it('lista la corrección de App-ID cuando difiere', () => {
    renderWithI18n(<PolicyTutor level={level} config={{ ...level.solution, app: 'any' }} />);
    expect(screen.getByText(/App-ID/)).toBeInTheDocument();
  });

  it('muestra varias correcciones cuando hay varias diferencias', () => {
    const config = { ...level.solution, app: 'any', nat: 'NONE' };
    const { container } = renderWithI18n(<PolicyTutor level={level} config={config} />);
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
  });

  it('muestra el mensaje noDiff cuando la config coincide', () => {
    renderWithI18n(<PolicyTutor level={level} config={{ ...level.solution }} />);
    expect(screen.getByText(/coincide con la solución/i)).toBeInTheDocument();
  });

  it('sin VITE_TUTOR_URL no muestra el botón de IA', () => {
    // En el entorno de test VITE_TUTOR_URL no está definida.
    renderWithI18n(<PolicyTutor level={level} config={{ ...level.solution, app: 'any' }} />);
    expect(screen.queryByRole('button', { name: /tutor ia/i })).not.toBeInTheDocument();
  });
});
