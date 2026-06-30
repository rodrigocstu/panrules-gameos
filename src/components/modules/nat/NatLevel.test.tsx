import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NatLevel } from './NatLevel';
import { useNatModule } from '../../../hooks/useNatModule';

beforeEach(() => localStorage.clear());

// NatLevel consume un UseNatModule; el harness provee uno real para un smoke E2E ligero.
function Harness() {
  const nat = useNatModule();
  return <NatLevel nat={nat} />;
}

describe('NatLevel', () => {
  it('renderiza la cabecera, el badge de tipo NAT y el editor', () => {
    render(<Harness />);
    expect(screen.getByText('Nivel 1 / 6')).toBeInTheDocument();
    expect(screen.getByText('Acceso seguro a Internet')).toBeInTheDocument(); // título nivel 1
    expect(screen.getByText('NAT: SNAT')).toBeInTheDocument(); // solution.nat del nivel 1
    expect(screen.getByRole('button', { name: 'Commit' })).toBeInTheDocument();
  });

  it('un Commit incorrecto dispara la intervención del avatar (cableado NAT_INTERVENTIONS)', () => {
    render(<Harness />);
    expect(screen.queryByTestId('avatar-intervention')).toBeNull();
    // El config inicial es incorrecto para el nivel 1 → onWrongAttempt muestra la burbuja.
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));
    expect(screen.getByTestId('avatar-intervention')).toBeInTheDocument();
  });
});
