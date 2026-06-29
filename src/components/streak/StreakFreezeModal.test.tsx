import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreakFreezeModal } from './StreakFreezeModal';

describe('StreakFreezeModal (AC#3 — StreakFreezeUI)', () => {
  it('muestra los freezeTokens restantes', () => {
    render(<StreakFreezeModal freezeTokens={2} onUseFreeze={() => {}} onDismiss={() => {}} />);
    expect(screen.getByText('2 Freezes disponibles')).toBeInTheDocument();
  });

  it('es un diálogo modal accesible (role=dialog, aria-modal, nombre accesible)', () => {
    render(<StreakFreezeModal freezeTokens={1} onUseFreeze={() => {}} onDismiss={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Protege tu racha');
  });

  it('"Usar Freeze" llama onUseFreeze (consumir un token)', () => {
    const onUseFreeze = vi.fn();
    render(<StreakFreezeModal freezeTokens={1} onUseFreeze={onUseFreeze} onDismiss={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Usar Freeze' }));
    expect(onUseFreeze).toHaveBeenCalledTimes(1);
  });

  it('Esc dispara onDismiss (vía useModalA11y)', () => {
    const onDismiss = vi.fn();
    render(<StreakFreezeModal freezeTokens={1} onUseFreeze={() => {}} onDismiss={onDismiss} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('sin tokens, "Usar Freeze" queda deshabilitado', () => {
    render(<StreakFreezeModal freezeTokens={0} onUseFreeze={() => {}} onDismiss={() => {}} />);
    expect(screen.getByRole('button', { name: 'Usar Freeze' })).toBeDisabled();
  });
});
