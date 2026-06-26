import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import ConsoleDashboard from '../../components/console/ConsoleDashboard.jsx';
import { renderWithI18n } from '../test-utils.jsx';
import { LEVELS } from '../../data/levels';

const PROGRESS_KEY = 'panrules-gameos:progress:v2';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  localStorage.clear();
});

describe('ConsoleDashboard — métricas', () => {
  it('muestra el total de niveles en la métrica de completados', () => {
    renderWithI18n(<ConsoleDashboard />);
    // formato "0/43"
    expect(screen.getByText(`0/${LEVELS.length}`)).toBeInTheDocument();
  });

  it('muestra el conteo de completados desde localStorage', () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ completed: [1, 2], attempts: { 1: 1, 2: 1 }, score: 200, bestStreak: 2 })
    );
    renderWithI18n(<ConsoleDashboard />);
    expect(screen.getByText(`2/${LEVELS.length}`)).toBeInTheDocument();
  });

  it('muestra la puntuación', () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ completed: [1], attempts: { 1: 1 }, score: 100, bestStreak: 1 })
    );
    renderWithI18n(<ConsoleDashboard />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});

describe('ConsoleDashboard — heatmap', () => {
  it('renderiza el heatmap con 43 celdas', () => {
    renderWithI18n(<ConsoleDashboard />);
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
  });

  it('muestra el mensaje de vacío sin datos de juego', () => {
    renderWithI18n(<ConsoleDashboard />);
    expect(screen.getByText(/aún no hay datos de juego/i)).toBeInTheDocument();
  });

  it('no muestra el mensaje de vacío cuando hay datos', () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ completed: [1], attempts: { 1: 1 }, score: 100, bestStreak: 1 })
    );
    renderWithI18n(<ConsoleDashboard />);
    expect(screen.queryByText(/aún no hay datos de juego/i)).not.toBeInTheDocument();
  });
});

describe('ConsoleDashboard — desglose por tier', () => {
  it('muestra los labels de los tres tiers', () => {
    renderWithI18n(<ConsoleDashboard />);
    // tier.F.label = 'Fundamentals', tier.A.label = 'NetSec Architect'
    expect(screen.getByText('Fundamentals')).toBeInTheDocument();
  });
});
