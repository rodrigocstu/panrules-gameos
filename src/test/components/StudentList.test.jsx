import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import StudentList from '../../components/console/StudentList.jsx';
import { renderWithI18n } from '../test-utils.jsx';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('StudentList — estado vacío', () => {
  it('muestra el mensaje de vacío sin cohorts', () => {
    renderWithI18n(<StudentList />);
    expect(screen.getByText(/aún no hay cohorts/i)).toBeInTheDocument();
  });

  it('el botón de crear está deshabilitado sin nombre', () => {
    renderWithI18n(<StudentList />);
    const btn = screen.getByRole('button', { name: /crear/i });
    expect(btn).toBeDisabled();
  });
});

describe('StudentList — crear cohort', () => {
  it('crea un cohort al enviar el formulario', () => {
    renderWithI18n(<StudentList />);
    const input = screen.getByLabelText(/nombre del cohort/i);
    fireEvent.change(input, { target: { value: 'Bootcamp Q3' } });
    fireEvent.click(screen.getByRole('button', { name: /crear/i }));
    expect(screen.getByText('Bootcamp Q3')).toBeInTheDocument();
  });

  it('limpia el input tras crear', () => {
    renderWithI18n(<StudentList />);
    const input = screen.getByLabelText(/nombre del cohort/i);
    fireEvent.change(input, { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: /crear/i }));
    expect(input.value).toBe('');
  });

  it('crea 3 cohorts (demo del gate S3)', () => {
    renderWithI18n(<StudentList />);
    const input = screen.getByLabelText(/nombre del cohort/i);
    const create = () => screen.getByRole('button', { name: /crear/i });
    ['A', 'B', 'C'].forEach((n) => {
      fireEvent.change(input, { target: { value: `Cohort ${n}` } });
      fireEvent.click(create());
    });
    const list = screen.getByRole('list', { name: /lista de cohorts/i });
    expect(list.querySelectorAll('li')).toHaveLength(3);
  });
});

describe('StudentList — eliminar', () => {
  it('elimina un cohort', () => {
    renderWithI18n(<StudentList />);
    const input = screen.getByLabelText(/nombre del cohort/i);
    fireEvent.change(input, { target: { value: 'Temp' } });
    fireEvent.click(screen.getByRole('button', { name: /crear/i }));
    fireEvent.click(screen.getByRole('button', { name: /eliminar cohort: temp/i }));
    expect(screen.queryByText('Temp')).not.toBeInTheDocument();
  });
});
