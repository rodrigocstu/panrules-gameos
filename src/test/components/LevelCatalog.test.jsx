import { describe, it, expect } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import LevelCatalog from '../../components/console/LevelCatalog.jsx';
import { renderWithI18n } from '../test-utils.jsx';
import { LEVELS } from '../../data/levels';

describe('LevelCatalog — listado', () => {
  it('lista los 43 niveles sin filtro', () => {
    renderWithI18n(<LevelCatalog />);
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(LEVELS.length);
  });

  it('muestra el id de cada nivel', () => {
    renderWithI18n(<LevelCatalog />);
    expect(screen.getByText('L1')).toBeInTheDocument();
    expect(screen.getByText('L43')).toBeInTheDocument();
  });
});

describe('LevelCatalog — filtro por track', () => {
  it('filtra a netsec-architect (13 niveles tier A)', () => {
    renderWithI18n(<LevelCatalog />);
    const archBtn = screen.getByRole('button', { name: /netsec architect/i });
    fireEvent.click(archBtn);
    const list = screen.getByRole('list');
    // tier A = 13 niveles
    expect(within(list).getAllByRole('listitem')).toHaveLength(13);
  });
});

describe('LevelCatalog — estado SME', () => {
  it('no muestra matices pendientes tras el sign-off SME (R-04 cerrado)', () => {
    renderWithI18n(<LevelCatalog />);
    // L25/L34/L38/L43 corregidos (Rodrigo, sign-off 2026-06-28); ya no hay pendientes
    expect(screen.queryByText(/matiz pendiente/i)).not.toBeInTheDocument();
  });
});
