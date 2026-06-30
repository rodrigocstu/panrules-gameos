import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PolicyEditorMobile } from './PolicyEditorMobile';
import { FIREWALL_LEVELS } from '../../../hooks/useFirewallModule';
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

describe('PolicyEditorMobile', () => {
  it('renderiza los 7 campos reales de PolicyConfig', () => {
    render(
      <PolicyEditorMobile
        level={FIREWALL_LEVELS[0]}
        config={CONFIG}
        onChange={() => {}}
        onSubmit={() => {}}
      />
    );
    for (const label of FIELD_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('group')).toHaveLength(7);
  });

  it('"Commit" llama onSubmit', () => {
    const onSubmit = vi.fn();
    render(
      <PolicyEditorMobile
        level={FIREWALL_LEVELS[0]}
        config={CONFIG}
        onChange={() => {}}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
