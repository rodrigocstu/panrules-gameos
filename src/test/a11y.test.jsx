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
import { PolicyListEditorMobile } from '../components/modules/policy/PolicyListEditorMobile';
import { ShadowBanner } from '../components/modules/policy/ShadowBanner';
import { PolicyModuleComplete } from '../components/modules/policy/PolicyModuleComplete';
import { POLICY_LEVELS, makeSeedRules } from '../hooks/usePolicyModule';
import { detectShadowing } from '../lib/firewall-engine';
import { AvatarIntervention } from '../components/avatar/AvatarIntervention';
import { HomeScreen } from '../components/shell/HomeScreen';
// EGC-14 — funnel de entrada (login → registro → onboarding → calibración): código nuevo del MVP
// y la primera pantalla que ve un usuario/revisor de tienda; faltaba del gate axe.
import { LoginScreen } from '../components/auth/LoginScreen';
import { RegisterScreen } from '../components/auth/RegisterScreen';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { CalibrationQuestion } from '../components/calibration/CalibrationQuestion';
import { CalibrationResult } from '../components/calibration/CalibrationResult';
import { CALIBRATION_QUESTIONS } from '../lib/calibration-questions';

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

  it('PolicyListEditorMobile (reglas ordenadas + shadowing) no tiene violaciones', async () => {
    const rules = makeSeedRules(POLICY_LEVELS[0]);
    const shadowReports = detectShadowing(rules);
    const violations = await noViolations(
      <PolicyListEditorMobile
        rules={rules}
        shadowReports={shadowReports}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        onToggleDisabled={() => {}}
        onSetField={() => {}}
        onSubmit={() => {}}
      />
    );
    expect(violations).toEqual([]);
  });

  it('ShadowBanner (aviso de shadowing) no tiene violaciones', async () => {
    const shadowReports = detectShadowing(makeSeedRules(POLICY_LEVELS[0]));
    const violations = await noViolations(<ShadowBanner shadowReports={shadowReports} />);
    expect(violations).toEqual([]);
  });

  it('PolicyModuleComplete (pantalla final) no tiene violaciones', async () => {
    const violations = await noViolations(<PolicyModuleComplete onRestart={() => {}} />);
    expect(violations).toEqual([]);
  });

  // EGC-17 — overlay global de situaciones de NORA montado en AppShell (AC#4).
  it('AvatarIntervention (overlay global de NORA) no tiene violaciones', async () => {
    const violations = await noViolations(
      <AvatarIntervention message="Mensaje de prueba de NORA." isVisible onDismiss={() => {}} />
    );
    expect(violations).toEqual([]);
  });

  // EGC-19 — overview del track Fundamentos (3 tarjetas de módulo + CTAs). Se siembra un módulo
  // completo para ejercitar también el badge "Completado".
  it('HomeScreen (overview del track) no tiene violaciones', async () => {
    localStorage.setItem(
      'egc_firewall_progress',
      JSON.stringify({ completed: [1, 2, 3, 4, 5, 6, 7, 8, 9] })
    );
    const violations = await noViolations(<HomeScreen />);
    expect(violations).toEqual([]);
  });

  // EGC-14 — funnel de entrada (auth/onboarding/calibración). Gap del gate axe: el código nuevo
  // del MVP que toca primero un usuario/revisor de tienda no estaba cubierto. Props mínimas y
  // válidas, handlers no-op; no se ejercita la lógica, solo el árbol accesible renderizado.
  it('LoginScreen (formulario de inicio de sesión) no tiene violaciones', async () => {
    const violations = await noViolations(
      <LoginScreen onSubmit={async () => {}} onSwitchToRegister={() => {}} />
    );
    expect(violations).toEqual([]);
  });

  it('RegisterScreen (alta de cuenta) no tiene violaciones', async () => {
    const violations = await noViolations(
      <RegisterScreen onSubmit={async () => {}} onSwitchToLogin={() => {}} />
    );
    expect(violations).toEqual([]);
  });

  it('OnboardingFlow (pantalla de bienvenida del onboarding) no tiene violaciones', async () => {
    // Stub de UseAuth: en el paso 'welcome' (inicial) los efectos de auth/calibración no disparan,
    // así que basta con los campos que el componente desestructura.
    const authStub = {
      isAuthenticated: false,
      user: null,
      register: async () => {},
      login: async () => {},
      completeCalibration: () => {},
      error: null,
    };
    const violations = await noViolations(<OnboardingFlow auth={authStub} />);
    expect(violations).toEqual([]);
  });

  it('CalibrationQuestion (pregunta de calibración) no tiene violaciones', async () => {
    const violations = await noViolations(
      <CalibrationQuestion
        question={CALIBRATION_QUESTIONS[0]}
        onAnswer={() => {}}
        currentIndex={0}
        total={CALIBRATION_QUESTIONS.length}
      />
    );
    expect(violations).toEqual([]);
  });

  it('CalibrationResult (bifurcación de resultado) no tiene violaciones', async () => {
    const score = {
      score: 5,
      total: 6,
      avgTimeMs: 9000,
      forcedBeginner: false,
      learningPath: 'beginner',
      recommendedStartLevel: 1,
      topicScores: {
        zones: 1,
        'app-id': 1,
        'nat-type': 1,
        'policy-order': 0,
        'security-profiles': 1,
      },
    };
    const violations = await noViolations(<CalibrationResult score={score} onStart={() => {}} />);
    expect(violations).toEqual([]);
  });
});
