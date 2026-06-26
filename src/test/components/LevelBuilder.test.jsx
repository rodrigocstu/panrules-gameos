import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import LevelBuilder from '../../components/console/LevelBuilder.jsx';
import { renderWithI18n } from '../test-utils.jsx';

describe('LevelBuilder — render', () => {
  it('muestra las secciones del formulario', () => {
    renderWithI18n(<LevelBuilder />);
    expect(screen.getByText(/metadatos/i)).toBeInTheDocument();
    expect(screen.getByText(/paquete y solución/i)).toBeInTheDocument();
  });

  it('renderiza el preview JSON', () => {
    renderWithI18n(<LevelBuilder />);
    // El preview es un <pre> con el JSON del nivel
    const pre = document.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre.textContent).toContain('"solution"');
  });
});

describe('LevelBuilder — validación', () => {
  it('marca inválido si faltan textos requeridos', () => {
    renderWithI18n(<LevelBuilder />);
    fireEvent.click(screen.getByRole('button', { name: /validar nivel/i }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/nivel inválido/i)).toBeInTheDocument();
  });

  it('marca válido cuando se completan los textos requeridos', () => {
    renderWithI18n(<LevelBuilder />);
    const fill = (labelRe, value) =>
      fireEvent.change(screen.getByText(labelRe).parentElement.querySelector('input'), {
        target: { value },
      });
    fill(/título \(es\)/i, 'T');
    fill(/título \(en\)/i, 'T');
    fill(/descripción \(es\)/i, 'D');
    fill(/descripción \(en\)/i, 'D');
    fill(/pista \(es\)/i, 'P');
    fill(/pista \(en\)/i, 'P');
    fill(/explicación \(es\)/i, 'E');
    fill(/explicación \(en\)/i, 'E');
    fireEvent.click(screen.getByRole('button', { name: /validar nivel/i }));
    expect(screen.getByText(/la solución gana en el motor/i)).toBeInTheDocument();
  });
});

describe('LevelBuilder — export', () => {
  it('tiene botones de copiar y descargar JSON', () => {
    renderWithI18n(<LevelBuilder />);
    expect(screen.getByRole('button', { name: /copiar json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descargar json/i })).toBeInTheDocument();
  });
});
