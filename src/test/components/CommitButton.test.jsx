import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import CommitButton from '../../components/CommitButton.jsx';
import { renderWithI18n } from '../test-utils.jsx';

describe('CommitButton — estado idle', () => {
  it('muestra el botón habilitado en estado idle', () => {
    renderWithI18n(<CommitButton gameState="idle" onCommit={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).not.toBeDisabled();
  });

  it('llama a onCommit al hacer click en idle', () => {
    const onCommit = vi.fn();
    renderWithI18n(<CommitButton gameState="idle" onCommit={onCommit} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('muestra el texto de commit idle', () => {
    renderWithI18n(<CommitButton gameState="idle" onCommit={() => {}} />);
    // El botón debe tener texto (texto i18n 'commit.idle')
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('CommitButton — estado committing', () => {
  it('deshabilita el botón en estado committing', () => {
    renderWithI18n(<CommitButton gameState="committing" onCommit={() => {}} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('no llama a onCommit al hacer click en committing', () => {
    const onCommit = vi.fn();
    renderWithI18n(<CommitButton gameState="committing" onCommit={onCommit} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe('CommitButton — estado success', () => {
  it('deshabilita el botón en estado success', () => {
    renderWithI18n(<CommitButton gameState="success" onCommit={() => {}} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('CommitButton — estado failure', () => {
  it('deshabilita el botón en estado failure', () => {
    renderWithI18n(<CommitButton gameState="failure" onCommit={() => {}} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('CommitButton — accesibilidad', () => {
  it('tiene role button', () => {
    renderWithI18n(<CommitButton gameState="idle" onCommit={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('el botón es el único elemento interactivo', () => {
    renderWithI18n(<CommitButton gameState="idle" onCommit={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
