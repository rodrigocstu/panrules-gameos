// LoginScreen — inicio de sesión (EGC-10).
//
// Formulario móvil con `autocomplete` (email / current-password). Igual que el registro,
// la contraseña se descarta del estado tras el envío. El padre (OnboardingFlow) decide la
// navegación según el estado de la sesión.
import { useState, type FormEvent } from 'react';
import { Button } from '../ui';

export interface LoginScreenProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string | null;
  loading?: boolean;
  onSwitchToRegister?: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LABEL = 'block text-mobile-sm font-medium text-neutral-700 mb-1';
const INPUT =
  'w-full min-h-touch px-3 py-2 rounded-lg border border-neutral-300 text-mobile-base ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function LoginScreen({
  onSubmit,
  error,
  loading = false,
  onSwitchToRegister,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const shownError = localError ?? error ?? null;
  const busy = loading || submitting;

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    if (!EMAIL_RE.test(email)) {
      setLocalError('Introduce un email válido.');
      return;
    }
    if (password.length === 0) {
      setLocalError('Introduce tu contraseña.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(email, password);
    } catch {
      // El detalle del error se muestra vía la prop `error` (estado de useAuth).
    } finally {
      setSubmitting(false);
      setPassword('');
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Formulario de inicio de sesión"
    >
      <div>
        <label htmlFor="login-email" className={LABEL}>
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT}
        />
      </div>

      <div>
        <label htmlFor="login-password" className={LABEL}>
          Contraseña
        </label>
        <input
          id="login-password"
          name="current-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT}
        />
      </div>

      {shownError && (
        <p role="alert" className="text-mobile-sm text-error-dark">
          {shownError}
        </p>
      )}

      <Button type="submit" loading={busy} className="w-full">
        Entrar
      </Button>

      {onSwitchToRegister && (
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-mobile-sm text-primary underline min-h-touch"
        >
          ¿No tienes cuenta? Regístrate
        </button>
      )}
    </form>
  );
}

export default LoginScreen;
