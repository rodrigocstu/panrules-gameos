import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import ConsoleSettings from '../../components/console/ConsoleSettings.jsx';
import { renderWithI18n } from '../test-utils.jsx';
import { isTelemetryEnabled, setTelemetryEnabled, recordResultEvent } from '../../lib/telemetry.js';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('ConsoleSettings — telemetría', () => {
  it('el toggle arranca desactivado', () => {
    renderWithI18n(<ConsoleSettings />);
    const toggle = screen.getByLabelText(/activar telemetría/i);
    expect(toggle).not.toBeChecked();
  });

  it('activar el toggle habilita la telemetría', () => {
    renderWithI18n(<ConsoleSettings />);
    fireEvent.click(screen.getByLabelText(/activar telemetría/i));
    expect(isTelemetryEnabled()).toBe(true);
  });

  it('muestra los contadores agregados cuando está activada', () => {
    setTelemetryEnabled(true);
    recordResultEvent({ tier: 'F', isWin: true, reasonCode: 'OK_ALLOW' });
    renderWithI18n(<ConsoleSettings />);
    // El panel de contadores aparece (commits/aciertos)
    expect(screen.getByText(/commits/i)).toBeInTheDocument();
  });
});

describe('ConsoleSettings — SLO dashboard', () => {
  it('muestra el objetivo de tests verdes', () => {
    renderWithI18n(<ConsoleSettings />);
    expect(screen.getByText(/tests verdes/i)).toBeInTheDocument();
    expect(screen.getByText('407')).toBeInTheDocument();
  });

  it('muestra los SLO pedagógicos por tier', () => {
    renderWithI18n(<ConsoleSettings />);
    expect(screen.getByText(/éxito tier f/i)).toBeInTheDocument();
  });

  it('muestra la fila de niveles activos', () => {
    renderWithI18n(<ConsoleSettings />);
    expect(screen.getByText(/niveles activos/i)).toBeInTheDocument();
    // El objetivo (43) y el actual (43) aparecen como valores de la fila SLO.
    expect(screen.getAllByText('43').length).toBeGreaterThanOrEqual(1);
  });
});

describe('ConsoleSettings — export', () => {
  it('tiene el botón de descarga CSV', () => {
    renderWithI18n(<ConsoleSettings />);
    expect(screen.getByRole('button', { name: /descargar csv/i })).toBeInTheDocument();
  });
});
