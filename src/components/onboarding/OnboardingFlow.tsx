// OnboardingFlow — espina del onboarding (EGC-10, AC#1).
//
// Máquina de estados welcome → auth → calibration → result que conecta auth, streak y
// calibración. La sesión (`auth`) la posee Root (fuente única de verdad) y se inyecta por
// prop; el flujo usa sus propias instancias de useStreak/useCalibration. Tras registrarse,
// inicializa la racha en 1 (AC#3) y arranca el test; al terminar, calcula la bifurcación y,
// al pulsar "Empezar Nivel X", marca la calibración completada (Root libera el gate → AppShell).
import { useEffect, useState } from 'react';
import type { UseAuth } from '../../hooks/useAuth';
import { useStreak } from '../../hooks/useStreak';
import { useCalibration } from '../../hooks/useCalibration';
import { navigateTo } from '../../hooks/useHashRoute.js';
import { AvatarBubble, Button, Card, OnboardingStep } from '../ui';
import { RegisterScreen } from '../auth/RegisterScreen';
import { LoginScreen } from '../auth/LoginScreen';
import { CalibrationQuestion } from '../calibration/CalibrationQuestion';
import { CalibrationResult } from '../calibration/CalibrationResult';

type Step = 'welcome' | 'auth' | 'calibration' | 'result';
type AuthTab = 'register' | 'login';

export interface OnboardingFlowProps {
  auth: UseAuth;
}

const STEP_NUMBER: Record<Step, number> = { welcome: 1, auth: 1, calibration: 2, result: 3 };

export function OnboardingFlow({ auth }: OnboardingFlowProps) {
  const { isAuthenticated, user, register, login, completeCalibration, error } = auth;
  const { initStreak } = useStreak();
  const calibration = useCalibration();
  const { phase, score, currentQuestion, currentIndex, total, start, answer, finalize } = calibration;

  const [step, setStep] = useState<Step>('welcome');
  const [authTab, setAuthTab] = useState<AuthTab>('register');

  // Tras autenticarse (registro o login) sin calibración previa: inicia racha y test.
  useEffect(() => {
    if (step === 'auth' && isAuthenticated && user && !user.calibrationDone) {
      initStreak(user.userId);
      start();
      setStep('calibration');
    }
  }, [step, isAuthenticated, user, initStreak, start]);

  // Al completar las 6 preguntas: persiste/envía el resultado y muestra la bifurcación.
  useEffect(() => {
    if (step === 'calibration' && phase === 'complete' && user) {
      void finalize(user.userId);
      setStep('result');
    }
  }, [step, phase, user, finalize]);

  function handleStart(): void {
    if (score) completeCalibration(score.learningPath);
    navigateTo('home');
  }

  function handleSkip(): void {
    completeCalibration('beginner');
    navigateTo('home');
  }

  if (step === 'welcome') {
    return (
      <main className="min-h-screen max-w-sm mx-auto px-4 py-10 flex flex-col items-center justify-center gap-6 text-center">
        <AvatarBubble size="xl" alt="NORA, tu guía" />
        <div className="flex flex-col gap-2">
          <h1 className="text-mobile-xl font-bold text-neutral-900">Bienvenido al CiberSec Edugame</h1>
          <p className="text-mobile-base text-neutral-600">
            Soy NORA, tu guía en este simulador de PAN-OS. Te haré 6 preguntas rápidas para
            asignarte el camino de aprendizaje ideal. No hay respuestas incorrectas: es un mapa,
            no un examen.
          </p>
        </div>
        <Button className="w-full" onClick={() => setStep('auth')}>
          Empezar
        </Button>
      </main>
    );
  }

  if (step === 'auth') {
    return (
      <main className="min-h-screen max-w-sm mx-auto px-4 py-8 flex flex-col gap-6">
        <OnboardingStep currentStep={STEP_NUMBER.auth} totalSteps={3} label="Paso 1 de 3: tu cuenta" />
        <div className="flex items-center gap-2" role="tablist" aria-label="Registro o inicio de sesión">
          <Button
            variant={authTab === 'register' ? 'primary' : 'ghost'}
            role="tab"
            aria-selected={authTab === 'register'}
            className="flex-1"
            onClick={() => setAuthTab('register')}
          >
            Crear cuenta
          </Button>
          <Button
            variant={authTab === 'login' ? 'primary' : 'ghost'}
            role="tab"
            aria-selected={authTab === 'login'}
            className="flex-1"
            onClick={() => setAuthTab('login')}
          >
            Entrar
          </Button>
        </div>

        {authTab === 'register' ? (
          <RegisterScreen
            onSubmit={async (email, password) => {
              await register(email, password);
            }}
            error={error}
            onSwitchToLogin={() => setAuthTab('login')}
          />
        ) : (
          <LoginScreen
            onSubmit={async (email, password) => {
              await login(email, password);
            }}
            error={error}
            onSwitchToRegister={() => setAuthTab('register')}
          />
        )}
      </main>
    );
  }

  if (step === 'calibration') {
    return (
      <main className="min-h-screen max-w-sm mx-auto flex flex-col">
        <div className="px-4 pt-6">
          <OnboardingStep
            currentStep={STEP_NUMBER.calibration}
            totalSteps={3}
            label="Paso 2 de 3: calibración"
          />
        </div>
        {currentQuestion ? (
          <CalibrationQuestion
            question={currentQuestion}
            onAnswer={answer}
            currentIndex={currentIndex}
            total={total}
          />
        ) : (
          <Card className="m-4" aria-label="Procesando">
            <p className="text-mobile-base text-neutral-600">Calculando tu ruta de aprendizaje…</p>
          </Card>
        )}
        <button
          type="button"
          onClick={handleSkip}
          className="mx-auto mb-6 text-mobile-sm text-neutral-500 underline min-h-touch"
        >
          Saltar — empezar desde el Nivel 1
        </button>
      </main>
    );
  }

  // step === 'result'
  return (
    <main className="min-h-screen max-w-sm mx-auto flex flex-col">
      <div className="px-4 pt-6">
        <OnboardingStep currentStep={STEP_NUMBER.result} totalSteps={3} label="Paso 3 de 3: resultado" />
      </div>
      {score ? (
        <CalibrationResult score={score} onStart={handleStart} />
      ) : (
        <Card className="m-4" aria-label="Procesando">
          <p className="text-mobile-base text-neutral-600">Calculando tu ruta de aprendizaje…</p>
        </Card>
      )}
    </main>
  );
}

export default OnboardingFlow;
