import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import HeatMap from '../../components/console/HeatMap.jsx';
import { renderWithI18n } from '../test-utils.jsx';

const makePerLevel = (overrides = []) => {
  const base = Array.from({ length: 43 }, (_, i) => ({
    id: i + 1,
    title: { es: `Nivel ${i + 1}`, en: `Level ${i + 1}` },
    tier: 'F',
    completed: false,
    attempts: 0,
    difficulty: 'untried',
  }));
  overrides.forEach((o) => {
    const idx = base.findIndex((l) => l.id === o.id);
    if (idx >= 0) base[idx] = { ...base[idx], ...o };
  });
  return base;
};

describe('HeatMap — estructura', () => {
  it('renderiza una celda por nivel (43)', () => {
    renderWithI18n(<HeatMap perLevel={makePerLevel()} />);
    const list = screen.getByRole('list');
    const cells = within(list).getAllByRole('listitem');
    expect(cells).toHaveLength(43);
  });

  it('cada celda muestra el id del nivel', () => {
    renderWithI18n(<HeatMap perLevel={makePerLevel()} />);
    const list = screen.getByRole('list');
    expect(within(list).getByText('1')).toBeInTheDocument();
    expect(within(list).getByText('43')).toBeInTheDocument();
  });

  it('la lista tiene aria-label accesible', () => {
    renderWithI18n(<HeatMap perLevel={makePerLevel()} />);
    expect(screen.getByRole('list')).toHaveAttribute('aria-label');
  });
});

describe('HeatMap — colores por dificultad', () => {
  it('aplica color verde a niveles fáciles', () => {
    const data = makePerLevel([{ id: 1, difficulty: 'easy', completed: true, attempts: 1 }]);
    renderWithI18n(<HeatMap perLevel={data} />);
    const list = screen.getByRole('list');
    const cell = within(list).getByText('1');
    expect(cell.className).toContain('bg-emerald-600');
  });

  it('aplica color rojo a niveles difíciles', () => {
    const data = makePerLevel([{ id: 2, difficulty: 'hard', completed: true, attempts: 5 }]);
    renderWithI18n(<HeatMap perLevel={data} />);
    const list = screen.getByRole('list');
    const cell = within(list).getByText('2');
    expect(cell.className).toContain('bg-red-700');
  });

  it('aplica estilo untried a niveles sin intentar', () => {
    renderWithI18n(<HeatMap perLevel={makePerLevel()} />);
    const list = screen.getByRole('list');
    const cell = within(list).getByText('5');
    expect(cell.className).toContain('bg-slate-800');
  });
});

describe('HeatMap — accesibilidad de celdas', () => {
  it('cada celda tiene aria-label con nombre del nivel', () => {
    const data = makePerLevel([{ id: 1, difficulty: 'easy', completed: true, attempts: 1 }]);
    renderWithI18n(<HeatMap perLevel={data} />);
    const list = screen.getByRole('list');
    const cell = within(list).getByText('1');
    expect(cell).toHaveAttribute('aria-label');
    expect(cell.getAttribute('aria-label')).toContain('Nivel 1');
  });
});

describe('HeatMap — leyenda', () => {
  it('muestra las 5 categorías de dificultad en la leyenda', () => {
    renderWithI18n(<HeatMap perLevel={makePerLevel()} />);
    // Las etiquetas de la leyenda (Fácil, Media, Difícil, Intentado, Sin intentar)
    expect(screen.getByText('Fácil')).toBeInTheDocument();
    expect(screen.getByText('Difícil')).toBeInTheDocument();
    expect(screen.getByText('Sin intentar')).toBeInTheDocument();
  });
});
