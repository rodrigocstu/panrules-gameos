import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResizeHandle from '../../components/ResizeHandle.jsx';

// ResizeHandle no usa i18n, no necesita I18nProvider.
// El elemento tiene aria-hidden="true", por lo que se necesita { hidden: true }.
const getSeparator = () => screen.getByRole('separator', { hidden: true });

describe('ResizeHandle — atributos de accesibilidad', () => {
  it('tiene role="separator"', () => {
    render(<ResizeHandle axis="horizontal" onMouseDown={() => {}} />);
    expect(getSeparator()).toBeInTheDocument();
  });

  it('tiene aria-hidden="true"', () => {
    render(<ResizeHandle axis="horizontal" onMouseDown={() => {}} />);
    expect(getSeparator()).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ResizeHandle — eje horizontal', () => {
  it('aplica clase de cursor col-resize en eje horizontal', () => {
    render(<ResizeHandle axis="horizontal" onMouseDown={() => {}} />);
    expect(getSeparator().className).toContain('cursor-col-resize');
  });

  it('aplica clase de ancho en eje horizontal', () => {
    render(<ResizeHandle axis="horizontal" onMouseDown={() => {}} />);
    expect(getSeparator().className).toContain('w-1');
  });

  it('no aplica cursor-row-resize en eje horizontal', () => {
    render(<ResizeHandle axis="horizontal" onMouseDown={() => {}} />);
    expect(getSeparator().className).not.toContain('cursor-row-resize');
  });
});

describe('ResizeHandle — eje vertical', () => {
  it('aplica clase de cursor row-resize en eje vertical', () => {
    render(<ResizeHandle axis="vertical" onMouseDown={() => {}} />);
    expect(getSeparator().className).toContain('cursor-row-resize');
  });

  it('aplica clase de altura en eje vertical', () => {
    render(<ResizeHandle axis="vertical" onMouseDown={() => {}} />);
    expect(getSeparator().className).toContain('h-1');
  });

  it('no aplica cursor-col-resize en eje vertical', () => {
    render(<ResizeHandle axis="vertical" onMouseDown={() => {}} />);
    expect(getSeparator().className).not.toContain('cursor-col-resize');
  });
});

describe('ResizeHandle — interacción', () => {
  it('llama a onMouseDown al recibir mousedown', () => {
    const onMouseDown = vi.fn();
    render(<ResizeHandle axis="horizontal" onMouseDown={onMouseDown} />);
    fireEvent.mouseDown(getSeparator());
    expect(onMouseDown).toHaveBeenCalledTimes(1);
  });

  it('no tiene tabindex (no está en el tab order de teclado)', () => {
    render(<ResizeHandle axis="horizontal" onMouseDown={() => {}} />);
    expect(getSeparator()).not.toHaveAttribute('tabindex');
  });
});
