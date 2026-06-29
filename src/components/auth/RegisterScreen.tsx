// RegisterScreen — alta de cuenta (EGC-10).
//
// Formulario móvil con `autocomplete` correcto (email / new-password) y validación en
// cliente (email, ≥8 caracteres, confirmación). La contraseña vive sólo en el estado del
// input mientras se escribe y se DESCARTA tras el envío (contrato de seguridad: nunca se
// retiene en estado tras `onSubmit`). El padre (OnboardingFlow) decide la navegación.
import { useState, type FormEvent } from 'react';
import { Button } from '../ui';

export interface RegisterScreenProps {
  /** Envía email + contraseña; el padre llama a useAuth.register. */
  onSubmit: (email: string, password: string) => Promise<void>;
  /** Mensaje de error del flujo de auth (async). */
  error?: string | null;
  loading?: boolean;
  onSwitchToLogin?: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LABEL = 'block text-mobile-sm font-medium text-neutral-700 mb-1';
const INPUT =
  'w-full min-h-touch px-3 py-2 rounded-lg border border-neutral-300 text-mobile-base ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function RegisterScreen({
  onSubmit,
  error,
  loading = false,
  onSwitchToLogin,
}: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
    if (password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(email, password);
    } catch {
      // El detalle del error se muestra vía la prop `error` (estado de useAuth).
    } finally {
      setSubmitting(false);
      // Seguridad: descartar la contraseña del estado en cuanto termina el envío.
      setPassword('');
      setConfirm('');
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Formulario de registro"
    >
      <div>
        <label htmlFor="reg-email" className={LABEL}>
          Email
        </label>
        <input
          id="reg-email"
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
        <label htmlFor="reg-password" className={LABEL}>
          Contraseña
        </label>
        <input
          id="reg-password"
          name="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="reg-password-hint"
          className={INPUT}
        />
        <p id="reg-password-hint" className="mt-1 text-mobile-xs text-neutral-500">
          Mínimo 8 caracteres.
        </p>
      </div>

      <div>
        <label htmlFor="reg-confirm" className={LABEL}>
          Confirmar contraseña
        </label>
        <input
          id="reg-confirm"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={INPUT}
        />
      </div>

      {shownError && (
        <p role="alert" className="text-mobile-sm text-error-dark">
          {shownError}
        </p>
      )}

      <Button type="submit" loading={busy} className="w-full">
        Crear cuenta
      </Button>

      {onSwitchToLogin && (
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-mobile-sm text-primary underline min-h-touch"
        >
          ¿Ya tienes cuenta? Inicia sesión
        </button>
      )}
    </form>
  );
}

export default RegisterScreen;
