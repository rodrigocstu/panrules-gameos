/**
 * EGC-8 — Design System WCAG 2.1 AA gate (axe-core).
 *
 * Matches the testing pattern established in src/test/a11y.test.jsx:
 * - color-contrast disabled (jsdom has no layout engine; Lighthouse CI covers it)
 * - wcag2a + wcag2aa rules enabled
 * - Each assertion: render → axe.run → expect(violations).toEqual([])
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { AvatarBubble } from './AvatarBubble';
import { StreakCounter } from './StreakCounter';
import { BottomNav } from './BottomNav';
import { OnboardingStep } from './OnboardingStep';

const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  rules: { 'color-contrast': { enabled: false } },
};

async function noViolations(ui) {
  const { container } = render(ui);
  const results = await axe.run(container, AXE_OPTIONS);
  return results.violations;
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('Design System — WCAG 2.1 AA (EGC-8)', () => {
  // ── Button ────────────────────────────────────────────────────────────────

  it('Button primary no tiene violaciones', async () => {
    const v = await noViolations(<Button variant="primary">Continuar</Button>);
    expect(v).toEqual([]);
  });

  it('Button secondary no tiene violaciones', async () => {
    const v = await noViolations(<Button variant="secondary">Cancelar</Button>);
    expect(v).toEqual([]);
  });

  it('Button ghost no tiene violaciones', async () => {
    const v = await noViolations(<Button variant="ghost">Más tarde</Button>);
    expect(v).toEqual([]);
  });

  it('Button loading no tiene violaciones', async () => {
    const v = await noViolations(<Button loading>Cargando…</Button>);
    expect(v).toEqual([]);
  });

  it('Button disabled no tiene violaciones', async () => {
    const v = await noViolations(<Button disabled>Bloqueado</Button>);
    expect(v).toEqual([]);
  });

  // ── Card ──────────────────────────────────────────────────────────────────

  it('Card sin label no tiene violaciones', async () => {
    const v = await noViolations(
      <Card>
        <p>Contenido</p>
      </Card>,
    );
    expect(v).toEqual([]);
  });

  it('Card con aria-label no tiene violaciones', async () => {
    const v = await noViolations(
      <Card aria-label="Tarjeta de módulo">
        <p>Contenido del módulo</p>
      </Card>,
    );
    expect(v).toEqual([]);
  });

  // ── Badge ─────────────────────────────────────────────────────────────────

  it('Badge default no tiene violaciones', async () => {
    const v = await noViolations(<Badge>Nuevo</Badge>);
    expect(v).toEqual([]);
  });

  it('Badge success no tiene violaciones', async () => {
    const v = await noViolations(<Badge variant="success">Completado</Badge>);
    expect(v).toEqual([]);
  });

  it('Badge error no tiene violaciones', async () => {
    const v = await noViolations(<Badge variant="error">Error</Badge>);
    expect(v).toEqual([]);
  });

  it('Badge warning no tiene violaciones', async () => {
    const v = await noViolations(<Badge variant="warning">Advertencia</Badge>);
    expect(v).toEqual([]);
  });

  // ── ProgressBar ───────────────────────────────────────────────────────────

  it('ProgressBar al 60 % no tiene violaciones', async () => {
    const v = await noViolations(
      <ProgressBar value={60} max={100} label="Progreso del módulo" />,
    );
    expect(v).toEqual([]);
  });

  it('ProgressBar en 0 % no tiene violaciones', async () => {
    const v = await noViolations(<ProgressBar value={0} label="Sin progreso" />);
    expect(v).toEqual([]);
  });

  it('ProgressBar al 100 % no tiene violaciones', async () => {
    const v = await noViolations(<ProgressBar value={100} label="Completado" color="success" />);
    expect(v).toEqual([]);
  });

  // ── AvatarBubble ──────────────────────────────────────────────────────────

  it('AvatarBubble placeholder NORA no tiene violaciones', async () => {
    const v = await noViolations(<AvatarBubble />);
    expect(v).toEqual([]);
  });

  it('AvatarBubble tamaño lg no tiene violaciones', async () => {
    const v = await noViolations(<AvatarBubble size="lg" />);
    expect(v).toEqual([]);
  });

  it('AvatarBubble con src e imagen no tiene violaciones', async () => {
    // Empty alt ("") means decorative — intentionally not tested here;
    // alt default "NORA" ensures the image always has an accessible name.
    const v = await noViolations(
      <AvatarBubble src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==" alt="Mentora NORA" />,
    );
    expect(v).toEqual([]);
  });

  // ── StreakCounter ─────────────────────────────────────────────────────────

  it('StreakCounter activo (7 días) no tiene violaciones', async () => {
    const v = await noViolations(<StreakCounter count={7} active />);
    expect(v).toEqual([]);
  });

  it('StreakCounter inactivo (0 días) no tiene violaciones', async () => {
    const v = await noViolations(<StreakCounter count={0} active={false} />);
    expect(v).toEqual([]);
  });

  it('StreakCounter activo (1 día) no tiene violaciones', async () => {
    const v = await noViolations(<StreakCounter count={1} active />);
    expect(v).toEqual([]);
  });

  // ── BottomNav ─────────────────────────────────────────────────────────────

  it('BottomNav pestaña home activa no tiene violaciones', async () => {
    const v = await noViolations(<BottomNav activeTab="home" onTabChange={() => {}} />);
    expect(v).toEqual([]);
  });

  it('BottomNav pestaña módulos activa no tiene violaciones', async () => {
    const v = await noViolations(<BottomNav activeTab="modulos" onTabChange={() => {}} />);
    expect(v).toEqual([]);
  });

  it('BottomNav pestaña streak activa no tiene violaciones', async () => {
    const v = await noViolations(<BottomNav activeTab="streak" onTabChange={() => {}} />);
    expect(v).toEqual([]);
  });

  it('BottomNav pestaña perfil activa no tiene violaciones', async () => {
    const v = await noViolations(<BottomNav activeTab="perfil" onTabChange={() => {}} />);
    expect(v).toEqual([]);
  });

  // ── OnboardingStep ────────────────────────────────────────────────────────

  it('OnboardingStep paso 1 de 6 no tiene violaciones', async () => {
    const v = await noViolations(<OnboardingStep currentStep={1} totalSteps={6} />);
    expect(v).toEqual([]);
  });

  it('OnboardingStep paso 3 de 6 no tiene violaciones', async () => {
    const v = await noViolations(<OnboardingStep currentStep={3} totalSteps={6} />);
    expect(v).toEqual([]);
  });

  it('OnboardingStep paso 6 de 6 no tiene violaciones', async () => {
    const v = await noViolations(<OnboardingStep currentStep={6} totalSteps={6} />);
    expect(v).toEqual([]);
  });
});
