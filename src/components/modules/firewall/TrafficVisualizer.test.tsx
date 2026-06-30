import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrafficVisualizer } from './TrafficVisualizer';

describe('TrafficVisualizer', () => {
  it('renderiza el estado idle con las etiquetas de zona', () => {
    render(<TrafficVisualizer srcZoneLabel="Trust-L3" dstZoneLabel="Untrust-L3" status="idle" />);
    const el = screen.getByTestId('traffic-visualizer');
    expect(el).toHaveAttribute('data-status', 'idle');
    expect(screen.getByText('Trust-L3')).toBeInTheDocument();
    expect(screen.getByText('Untrust-L3')).toBeInTheDocument();
  });

  it('renderiza el estado blocked y lo anuncia en la etiqueta accesible', () => {
    render(<TrafficVisualizer srcZoneLabel="Guest-L3" dstZoneLabel="Untrust-L3" status="blocked" />);
    const el = screen.getByTestId('traffic-visualizer');
    expect(el).toHaveAttribute('data-status', 'blocked');
    expect(el.getAttribute('aria-label')).toContain('bloqueado');
  });
});
