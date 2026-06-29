import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PolicyField } from './PolicyField';

const OPTIONS = [
  { id: 'ALLOW', label: 'allow' },
  { id: 'DENY', label: 'deny' },
];

describe('PolicyField', () => {
  it('renderiza el label y las opciones', () => {
    render(<PolicyField label="Action" value="ALLOW" options={OPTIONS} onChange={() => {}} />);
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'allow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'deny' })).toBeInTheDocument();
  });

  it('marca la opción seleccionada con aria-pressed', () => {
    render(<PolicyField label="Action" value="ALLOW" options={OPTIONS} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'allow' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'deny' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('seleccionar una opción llama onChange con su id', () => {
    const onChange = vi.fn();
    render(<PolicyField label="Action" value="ALLOW" options={OPTIONS} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'deny' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('DENY');
  });
});
