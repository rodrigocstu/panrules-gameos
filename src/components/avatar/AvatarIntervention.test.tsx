import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import axe, { type RunOptions } from 'axe-core';
import { AvatarIntervention } from './AvatarIntervention';

const AXE_OPTIONS: RunOptions = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  rules: { 'color-contrast': { enabled: false } },
};

describe('AvatarIntervention', () => {
  it('muestra el mensaje cuando isVisible=true', () => {
    render(<AvatarIntervention message="Hola, soy NORA" isVisible onDismiss={() => {}} />);
    expect(screen.getByText('Hola, soy NORA')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-intervention')).toBeInTheDocument();
  });

  it('oculta el mensaje cuando isVisible=false', () => {
    render(<AvatarIntervention message="Hola" isVisible={false} onDismiss={() => {}} />);
    expect(screen.queryByTestId('avatar-intervention')).toBeNull();
  });

  it('expone una región aria-live="polite"', () => {
    render(<AvatarIntervention message="Hola" isVisible onDismiss={() => {}} />);
    expect(screen.getByTestId('avatar-live-region')).toHaveAttribute('aria-live', 'polite');
  });

  it('un tap en la burbuja llama onDismiss', () => {
    const onDismiss = vi.fn();
    render(<AvatarIntervention message="Hola" isVisible onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('avatar-intervention'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('no tiene violaciones de accesibilidad (axe wcag2 a/aa)', async () => {
    const { container } = render(
      <AvatarIntervention message="Hola, soy NORA" isVisible onDismiss={() => {}} />
    );
    const results = await axe.run(container, AXE_OPTIONS);
    expect(results.violations).toEqual([]);
  });
});
