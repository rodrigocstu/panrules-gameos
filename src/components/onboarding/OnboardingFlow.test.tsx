import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingFlow } from './OnboardingFlow';

beforeEach(() => localStorage.clear());

// Arnés que reproduce el gate de Root: muestra el onboarding hasta que la sesión esté
// autenticada Y calibrada; entonces revela el "home" (contenido protegido).
function Harness() {
  const auth = useAuth();
  if (auth.loading) return <div>cargando</div>;
  if (auth.isAuthenticated && auth.user?.calibrationDone) {
    return <div data-testid="app-home">HOME</div>;
  }
  return <OnboardingFlow auth={auth} />;
}

describe('OnboardingFlow (integración offline, AC#1)', () => {
  it('registro → calibración de 6 preguntas → resultado bifurcado → home', async () => {
    render(<Harness />);

    // Pantalla de bienvenida.
    await screen.findByText('Bienvenido al CiberSec Edugame');
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));

    // Registro.
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nuevo@panrules.dev' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    // Calibración: responde las 6 preguntas (selecciona una opción y avanza).
    for (let i = 0; i < 6; i += 1) {
      const isLast = i === 5;
      const advance = await screen.findByRole('button', {
        name: isLast ? 'Finalizar' : 'Siguiente',
      });
      const optionButtons = screen
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-pressed') !== null);
      expect(optionButtons).toHaveLength(4);
      fireEvent.click(optionButtons[0]);
      fireEvent.click(advance);
    }

    // Resultado con bifurcación + CTA de inicio.
    const startButton = await screen.findByRole('button', { name: /Empezar Nivel/ });
    fireEvent.click(startButton);

    // El gate libera y se monta el contenido protegido.
    await screen.findByTestId('app-home');
    expect(screen.getByTestId('app-home')).toBeInTheDocument();
  });
});
