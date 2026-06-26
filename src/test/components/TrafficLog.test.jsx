import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import TrafficLog from '../../components/TrafficLog.jsx';
import { renderWithI18n } from '../test-utils.jsx';

const makeLogs = (n = 3) =>
  Array.from({ length: n }, (_, i) => ({
    id: `log-${i}`,
    time: `00:0${i}`,
    src: `10.0.0.${i}`,
    dst: `8.8.8.${i}`,
    app: i % 2 === 0 ? 'web-browsing' : 'ssl',
    action: i % 2 === 0 ? 'ALLOW' : 'DENY',
  }));

describe('TrafficLog — estructura básica', () => {
  it('renderiza la tabla con las filas de logs', () => {
    renderWithI18n(<TrafficLog logs={makeLogs(3)} onSelectLog={() => {}} />);
    // 3 filas de datos (sin contar el encabezado)
    const rows = screen.getAllByRole('button');
    expect(rows).toHaveLength(3);
  });

  it('renderiza sin filas cuando logs está vacío', () => {
    renderWithI18n(<TrafficLog logs={[]} onSelectLog={() => {}} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('muestra la IP de origen en cada fila', () => {
    renderWithI18n(<TrafficLog logs={makeLogs(2)} onSelectLog={() => {}} />);
    expect(screen.getByText('10.0.0.0')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
  });

  it('muestra la IP de destino en cada fila', () => {
    renderWithI18n(<TrafficLog logs={makeLogs(2)} onSelectLog={() => {}} />);
    expect(screen.getByText('8.8.8.0')).toBeInTheDocument();
  });
});

describe('TrafficLog — interacción', () => {
  it('llama a onSelectLog con el log correcto al hacer click', () => {
    const onSelectLog = vi.fn();
    const logs = makeLogs(2);
    renderWithI18n(<TrafficLog logs={logs} onSelectLog={onSelectLog} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onSelectLog).toHaveBeenCalledWith(logs[0]);
  });

  it('llama a onSelectLog con Enter sobre la fila', () => {
    const onSelectLog = vi.fn();
    const logs = makeLogs(2);
    renderWithI18n(<TrafficLog logs={logs} onSelectLog={onSelectLog} />);
    fireEvent.keyDown(screen.getAllByRole('button')[1], { key: 'Enter' });
    expect(onSelectLog).toHaveBeenCalledWith(logs[1]);
  });

  it('llama a onSelectLog con Space sobre la fila', () => {
    const onSelectLog = vi.fn();
    const logs = makeLogs(1);
    renderWithI18n(<TrafficLog logs={logs} onSelectLog={onSelectLog} />);
    fireEvent.keyDown(screen.getAllByRole('button')[0], { key: ' ' });
    expect(onSelectLog).toHaveBeenCalledWith(logs[0]);
  });

  it('cada fila tiene tabIndex=0', () => {
    renderWithI18n(<TrafficLog logs={makeLogs(2)} onSelectLog={() => {}} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('tabindex', '0');
    });
  });
});

describe('TrafficLog — prop style', () => {
  it('aplica style inline al contenedor raíz', () => {
    const { container } = renderWithI18n(
      <TrafficLog logs={[]} onSelectLog={() => {}} style={{ height: 200 }} />,
    );
    expect(container.firstChild).toHaveStyle({ height: '200px' });
  });
});
