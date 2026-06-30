import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NatEditorMobile } from './NatEditorMobile';
import { NAT_LEVELS } from '../../../hooks/useNatModule';
import type { PolicyConfig } from '../../../types/domain';

const CONFIG: PolicyConfig = {
  srcZone: 'trust',
  dstZone: 'trust',
  app: 'any',
  service: 'any',
  action: 'ALLOW',
  nat: 'NONE',
  profile: 'none',
};

const FIELD_LABELS = [
  'Source Zone',
  'Destination Zone',
  'Application (App-ID)',
  'Service',
  'Action',
  'NAT',
  'Security Profile',
];

describe('NatEditorMobile', () => {
  it('renderiza los 7 campos reales de PolicyConfig', () => {
    render(
      <NatEditorMobile level={NAT_LEVELS[0]} config={CONFIG} onChange={() => {}} onSubmit={() => {}} />
    );
    for (const label of FIELD_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('group')).toHaveLength(7);
  });

  it('muestra el diagrama de contexto NAT con el tipo del nivel (badge)', () => {
    // NAT_LEVELS[0] = nivel 1, nat.type / solution.nat = 'SNAT'
    render(
      <NatEditorMobile level={NAT_LEVELS[0]} config={CONFIG} onChange={() => {}} onSubmit={() => {}} />
    );
    expect(screen.getByTestId('nat-context')).toBeInTheDocument();
    expect(screen.getByText('SNAT')).toBeInTheDocument();
  });

  it('"Commit" llama onSubmit', () => {
    const onSubmit = vi.fn();
    render(
      <NatEditorMobile level={NAT_LEVELS[0]} config={CONFIG} onChange={() => {}} onSubmit={onSubmit} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
