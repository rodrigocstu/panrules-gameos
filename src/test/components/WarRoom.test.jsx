import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import WarRoom from '../../components/WarRoom.jsx';
import { renderWithI18n } from '../test-utils.jsx';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('WarRoom — pantalla de unión', () => {
  it('muestra el formulario de unión al entrar', () => {
    renderWithI18n(<WarRoom />);
    expect(screen.getByText(/unirse a la sala/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tu nombre/i)).toBeInTheDocument();
  });

  it('el botón Entrar está deshabilitado sin nombre', () => {
    renderWithI18n(<WarRoom />);
    expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled();
  });

  it('al unirse muestra la sala con el editor colaborativo', () => {
    renderWithI18n(<WarRoom />);
    fireEvent.change(screen.getByLabelText(/tu nombre/i), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    expect(screen.getByText(/política colaborativa/i)).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });
});

describe('WarRoom — permisos por rol', () => {
  function joinAs(role) {
    renderWithI18n(<WarRoom />);
    fireEvent.change(screen.getByLabelText(/tu nombre/i), { target: { value: 'Ana' } });
    // Seleccionar rol
    fireEvent.change(screen.getByLabelText(/^rol$/i), { target: { value: role } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
  }

  it('el rol security puede editar App pero no NAT', () => {
    joinAs('security');
    const appSelect = screen.getByLabelText('Aplicación');
    const natSelect = screen.getByLabelText('Tipo de NAT (NAT rulebase)');
    expect(appSelect).not.toBeDisabled();
    expect(natSelect).toBeDisabled();
  });

  it('el rol nat puede editar NAT pero no App', () => {
    joinAs('nat');
    expect(screen.getByLabelText('Tipo de NAT (NAT rulebase)')).not.toBeDisabled();
    expect(screen.getByLabelText('Aplicación')).toBeDisabled();
  });

  it('el validador ve el commit habilitado', () => {
    joinAs('validator');
    expect(screen.getByRole('button', { name: /commit y validar/i })).not.toBeDisabled();
  });

  it('security NO puede hacer commit', () => {
    joinAs('security');
    expect(screen.getByRole('button', { name: /commit y validar/i })).toBeDisabled();
  });
});

describe('WarRoom — controles del instructor', () => {
  function joinAsInstructor() {
    renderWithI18n(<WarRoom />);
    fireEvent.change(screen.getByLabelText(/tu nombre/i), { target: { value: 'Inst' } });
    fireEvent.change(screen.getByLabelText(/^rol$/i), { target: { value: 'instructor' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
  }

  it('el instructor ve los botones de pausa y nuevo ticket', () => {
    joinAsInstructor();
    expect(screen.getByRole('button', { name: /pausar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo ticket/i })).toBeInTheDocument();
  });

  it('pausar muestra el banner y congela los selects', () => {
    joinAsInstructor();
    fireEvent.click(screen.getByRole('button', { name: /pausar/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/pausó la sesión/i);
  });
});

describe('WarRoom — commit y validación', () => {
  it('el validador hace commit y aparece un resultado', () => {
    renderWithI18n(<WarRoom />);
    fireEvent.change(screen.getByLabelText(/tu nombre/i), { target: { value: 'Val' } });
    fireEvent.change(screen.getByLabelText(/^rol$/i), { target: { value: 'validator' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    fireEvent.click(screen.getByRole('button', { name: /commit y validar/i }));
    // El nivel 1 con config por defecto falla → resultado de configuración incorrecta
    expect(screen.getByText(/configuración incorrecta/i)).toBeInTheDocument();
    expect(screen.getByText(/validado por val/i)).toBeInTheDocument();
  });
});
