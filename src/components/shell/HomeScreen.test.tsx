import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';

// HomeScreen (EGC-19): overview navegable del track Fundamentos. Lee progreso read-only de
// localStorage (claves egc_firewall_progress / egc_nat_progress / egc_policy_progress) y los CTA
// navegan SIEMPRE a firewall/nat/policy (modelo open-access). navigateTo escribe window.location.hash,
// así que las aserciones de navegación se hacen sobre el hash.

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
});
afterEach(() => {
  localStorage.clear();
  window.location.hash = '';
});

describe('HomeScreen', () => {
  it('renderiza las 3 tarjetas de módulo del track', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('heading', { name: 'El Portero' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'La Centralita' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Políticas de Red' })).toBeInTheDocument();
  });

  it('lee el progreso real de localStorage (3/9 para Firewall sembrado)', () => {
    localStorage.setItem('egc_firewall_progress', JSON.stringify({ completed: [1, 2, 3] }));
    render(<HomeScreen />);
    const card = screen.getByRole('region', { name: /El Portero/ });
    // El nombre accesible de la tarjeta codifica el progreso ("3 de 9 niveles completados").
    expect(card).toHaveAccessibleName(/3 de 9/);
  });

  it('degrada a 0/N cuando la clave está ausente, y el CTA sigue navegable', () => {
    render(<HomeScreen />);
    const card = screen.getByRole('region', { name: /La Centralita/ });
    expect(card).toHaveAccessibleName(/0 de 6/);
    fireEvent.click(within(card).getByRole('button'));
    expect(window.location.hash).toBe('#/nat');
  });

  it('muestra el badge "Completado" cuando completados >= total', () => {
    localStorage.setItem(
      'egc_firewall_progress',
      JSON.stringify({ completed: [1, 2, 3, 4, 5, 6, 7, 8, 9] })
    );
    render(<HomeScreen />);
    const card = screen.getByRole('region', { name: /El Portero/ });
    expect(within(card).getByText('Completado')).toBeInTheDocument();
    expect(card).toHaveAccessibleName(/9 de 9/);
  });

  it('los 3 CTA navegan a firewall, nat y policy respectivamente', () => {
    render(<HomeScreen />);

    fireEvent.click(within(screen.getByRole('region', { name: /El Portero/ })).getByRole('button'));
    expect(window.location.hash).toBe('#/firewall');

    fireEvent.click(
      within(screen.getByRole('region', { name: /La Centralita/ })).getByRole('button')
    );
    expect(window.location.hash).toBe('#/nat');

    fireEvent.click(
      within(screen.getByRole('region', { name: /Políticas de Red/ })).getByRole('button')
    );
    expect(window.location.hash).toBe('#/policy');
  });

  it('no lanza ante JSON corrupto en una clave (cae a 0/N)', () => {
    localStorage.setItem('egc_policy_progress', 'no-es-json{{{');
    expect(() => render(<HomeScreen />)).not.toThrow();
    const card = screen.getByRole('region', { name: /Políticas de Red/ });
    expect(card).toHaveAccessibleName(/0 de 9/);
  });
});
