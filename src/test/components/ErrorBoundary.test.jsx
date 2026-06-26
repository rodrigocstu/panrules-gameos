import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary.jsx';

// Componente auxiliar que lanza un error cuando shouldThrow=true.
function Bomb({ shouldThrow = false }) {
  if (shouldThrow) throw new Error('test error message');
  return <div>Contenido normal</div>;
}

// Silenciar console.error para evitar ruido de React en los tests de ErrorBoundary.
let consoleError;
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  consoleError.mockRestore();
});

describe('ErrorBoundary — renders children', () => {
  it('muestra los hijos cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Contenido normal')).toBeInTheDocument();
  });

  it('no muestra el fallback por defecto cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('ErrorBoundary — fallback por defecto', () => {
  it('muestra role="alert" cuando un hijo lanza error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('muestra el mensaje del error en el fallback', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('test error message')).toBeInTheDocument();
  });

  it('muestra el botón de reintentar', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});

describe('ErrorBoundary — retry', () => {
  it('vuelve a mostrar los hijos después de reintentar (si ya no lanza)', () => {
    // Render inicial sin error; luego forzamos el error state manualmente via prop.
    // Simulamos el retry: usamos un componente que puede cambiar de estado.
    let throwError = true;
    function ToggleBomb() {
      if (throwError) throw new Error('oops');
      return <div>Recuperado</div>;
    }

    render(
      <ErrorBoundary>
        <ToggleBomb />
      </ErrorBoundary>,
    );

    // Está en modo error
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Antes de reintentar, desactivamos el error en el componente hijo
    throwError = false;
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    expect(screen.getByText('Recuperado')).toBeInTheDocument();
  });
});

describe('ErrorBoundary — fallback personalizado', () => {
  it('llama al prop fallback con el error cuando se proporciona', () => {
    const customFallback = (error) => <div>Error personalizado: {error.message}</div>;
    render(
      <ErrorBoundary fallback={customFallback}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Error personalizado: test error message')).toBeInTheDocument();
  });

  it('no muestra el fallback por defecto si se pasa prop fallback', () => {
    const customFallback = () => <div data-testid="custom">custom</div>;
    render(
      <ErrorBoundary fallback={customFallback}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });
});

describe('ErrorBoundary — múltiples hijos', () => {
  it('captura el error incluso con varios hijos', () => {
    render(
      <ErrorBoundary>
        <div>Hermano A</div>
        <Bomb shouldThrow />
        <div>Hermano B</div>
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Hermano A')).not.toBeInTheDocument();
  });
});
