import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { PolicyListEditorMobile } from './PolicyListEditorMobile';
import type { PolicyRule, ShadowReport } from '../../../types/domain';

const RULES: PolicyRule[] = [
  {
    id: 'rule-broad',
    srcZone: 'any',
    dstZone: 'any',
    app: 'any',
    service: 'service-http',
    action: 'DENY',
    nat: 'NONE',
    profile: 'none',
  },
  {
    id: 'rule-solution',
    srcZone: 'trust',
    dstZone: 'untrust',
    app: 'web-browsing',
    service: 'application-default',
    action: 'ALLOW',
    nat: 'NONE',
    profile: 'none',
  },
];

const SHADOW: ShadowReport[] = [
  { shadowedRuleId: 'rule-solution', shadowingRuleId: 'rule-broad', reason: 'deny-before-allow' },
];

function renderEditor(overrides: Partial<React.ComponentProps<typeof PolicyListEditorMobile>> = {}) {
  const props = {
    rules: RULES,
    shadowReports: SHADOW,
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onToggleDisabled: vi.fn(),
    onSetField: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<PolicyListEditorMobile {...props} />);
  return props;
}

describe('PolicyListEditorMobile', () => {
  it('renderiza las reglas en orden (Regla 1, Regla 2)', () => {
    renderEditor();
    expect(screen.getByText('Regla 1')).toBeInTheDocument();
    expect(screen.getByText('Regla 2')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('data-testid', 'policy-rule-0');
  });

  it('subir/bajar invocan el callback con el índice correcto', () => {
    const props = renderEditor();
    // La primera regla no puede subir (botón deshabilitado); la segunda sí.
    fireEvent.click(screen.getByRole('button', { name: 'Subir Regla 2' }));
    expect(props.onMoveUp).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Bajar Regla 1' }));
    expect(props.onMoveDown).toHaveBeenCalledWith(0);
  });

  it('el botón subir de la primera regla y bajar de la última están deshabilitados', () => {
    renderEditor();
    expect(screen.getByRole('button', { name: 'Subir Regla 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bajar Regla 2' })).toBeDisabled();
  });

  it('el toggle deshabilitar invoca onToggleDisabled con el índice', () => {
    const props = renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Deshabilitar Regla 1' }));
    expect(props.onToggleDisabled).toHaveBeenCalledWith(0);
  });

  it('editar un chip de campo invoca onSetField con (idx, field, value)', () => {
    const props = renderEditor();
    const rule1 = screen.getByTestId('policy-rule-0');
    // Cambia la acción de la Regla 1 a ALLOW vía el chip correspondiente.
    fireEvent.click(within(rule1).getByRole('button', { name: 'allow' }));
    expect(props.onSetField).toHaveBeenCalledWith(0, 'action', 'ALLOW');
  });

  it('marca la regla sombreada con indicación accesible en texto (no solo color)', () => {
    renderEditor();
    const shadowed = screen.getByTestId('policy-rule-1');
    expect(shadowed).toHaveAttribute('data-shadowed', 'true');
    expect(within(shadowed).getByText('sombreada')).toBeInTheDocument();
    expect(within(shadowed).getByText(/nunca se evalúa/i)).toBeInTheDocument();
  });

  it('los botones de orden y el toggle tienen área táctil (min-h-touch)', () => {
    renderEditor();
    const up = screen.getByRole('button', { name: 'Subir Regla 2' });
    const toggle = screen.getByRole('button', { name: 'Deshabilitar Regla 1' });
    expect(up.className).toContain('min-h-touch');
    expect(toggle.className).toContain('min-h-touch');
  });

  it('"Comprobar" invoca onSubmit', () => {
    const props = renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });
});
