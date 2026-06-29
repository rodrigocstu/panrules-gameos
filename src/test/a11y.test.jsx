import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { I18nProvider } from '../i18n/I18nContext.jsx';
import TopBar from '../components/TopBar.jsx';
import CommitButton from '../components/CommitButton.jsx';
import ConsoleSettings from '../components/console/ConsoleSettings.jsx';
import WarRoom from '../components/WarRoom.jsx';
import HeatMap from '../components/console/HeatMap.jsx';
import { StreakFreezeModal } from '../components/streak/StreakFreezeModal';
import { CalendarStrip } from '../components/streak/StreakDashboard';
import { NatEditorMobile } from '../components/modules/nat/NatEditorMobile';
import { NAT_LEVELS } from '../hooks/useNatModule';

// Gate WCAG AA ejecutable (WBS 2.3 / 6.2). Corre axe-core sobre el árbol
// renderizado en jsdom. color-contrast no se evalúa en jsdom (no hay layout
// real), por eso se desactiva; el workflow de Lighthouse cubre el contraste.
const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  rules: { 'color-contrast': { enabled: false } },
};

async function noViolations(ui) {
  const { container } = render(<I18nProvider>{ui}</I18nProvider>);
  const results = await axe.run(container, AXE_OPTIONS);
  return results.violations;
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('Accesibilidad (axe-core, WCAG 2 A/AA)', () => {
  it('TopBar no tiene violaciones', async () => {
    const violations = await noViolations(<TopBar score={10} streak={2} />);
    expect(violations).toEqual([]);
  });

  it('CommitButton no tiene violaciones', async () => {
    const violations = await noViolations(<CommitButton gameState="idle" onCommit={() => {}} />);
    expect(violations).toEqual([]);
  });

  it('ConsoleSettings no tiene violaciones', async () => {
    const violations = await noViolations(<ConsoleSettings />);
    expect(violations).toEqual([]);
  });

  it('WarRoom (pantalla de unión) no tiene violaciones', async () => {
    const violations = await noViolations(<WarRoom />);
    expect(violations).toEqual([]);
  });

  it('HeatMap no tiene violaciones', async () => {
    const perLevel = Array.from({ length: 43 }, (_, i) => ({
      id: i + 1,
      title: { es: `Nivel ${i + 1}`, en: `Level ${i + 1}` },
      tier: 'F',
      completed: false,
      attempts: 0,
      difficulty: 'untried',
    }));
    const violations = await noViolations(<HeatMap perLevel={perLevel} />);
    expect(violations).toEqual([]);
  });

  // EGC-12 — nuevos modales/diagramas (plan §10).
  it('StreakFreezeModal no tiene violaciones', async () => {
    const violations = await noViolations(
      <StreakFreezeModal freezeTokens={2} onUseFreeze={() => {}} onDismiss={() => {}} />
    );
    expect(violations).toEqual([]);
  });

  it('CalendarStrip (calendario de racha) no tiene violaciones', async () => {
    const days = [
      { date: '2026-06-29', active: true, levelsCompleted: 1 },
      { date: '2026-06-28', active: true, levelsCompleted: 0, isFreeze: true },
      { date: '2026-06-27', active: false, levelsCompleted: 0 },
    ];
    const violations = await noViolations(<CalendarStrip days={days} />);
    expect(violations).toEqual([]);
  });

  it('NatEditorMobile (diagrama NAT + campos) no tiene violaciones', async () => {
    const config = {
      srcZone: 'trust',
      dstZone: 'trust',
      app: 'any',
      service: 'any',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'none',
    };
    const violations = await noViolations(
      <NatEditorMobile level={NAT_LEVELS[0]} config={config} onChange={() => {}} onSubmit={() => {}} />
    );
    expect(violations).toEqual([]);
  });
});
