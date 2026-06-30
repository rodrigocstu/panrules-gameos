// useAuth — sesión JWT offline-first (EGC-10).
//
// Fuente única de verdad de la sesión (la posee `Root`, ver src/Root.jsx). Los tokens
// se guardan vía el token store consciente del canal (`localStorage` web /
// `@capacitor/preferences` nativo), nunca en estado de React. La contraseña llega como
// argumento, se envía a la API y se descarta — jamás se persiste en estado (contrato de
// seguridad de la tarea).
//
// Modo offline (`VITE_API_URL` vacío): register/login crean/restauran un usuario mock en
// el almacén del canal y siempre tienen éxito (sólo local, sin red). La hidratación en el
// montaje lee el perfil cacheado y resuelve `loading=false` para que el gate de Root
// pueda decidir ANTES de renderizar contenido protegido (AC#4).
import { useState, useEffect, useCallback, useRef } from 'react';
import type { LearningPath, UserProfile } from '../types/domain';
import { api, isOffline } from '../services/api';
import { setTokens, clearTokens, storageGet, storageSet, storageRemove } from '../lib/tokenStore';
import { genId } from '../lib/ids';

const AUTH_USER_KEY = 'egc_auth_user';
const LEARNING_PATHS: ReadonlySet<string> = new Set(['beginner', 'intermediate', 'advanced']);

function nowIso(): string {
  return new Date().toISOString();
}

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== 'object' || value === null) return false;
  const u = value as Record<string, unknown>;
  return (
    typeof u.userId === 'string' &&
    typeof u.email === 'string' &&
    typeof u.displayName === 'string' &&
    typeof u.createdAt === 'string' &&
    typeof u.lastSeenAt === 'string' &&
    typeof u.learningPath === 'string' &&
    LEARNING_PATHS.has(u.learningPath) &&
    typeof u.calibrationDone === 'boolean'
  );
}

function defaultDisplayName(email: string, displayName?: string): string {
  if (displayName && displayName.trim()) return displayName.trim();
  const handle = email.split('@')[0];
  return handle || 'Estudiante';
}

/** Perfil mock para el modo offline (sin backend). */
export function makeOfflineUser(email: string, displayName?: string): UserProfile {
  return {
    userId: `offline-${genId()}`,
    email,
    displayName: defaultDisplayName(email, displayName),
    createdAt: nowIso(),
    lastSeenAt: nowIso(),
    learningPath: 'beginner',
    calibrationDone: false,
  };
}

export interface UseAuth {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string, displayName?: string) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  /** Marca la calibración completada y fija el learning path resultante. */
  completeCalibration: (learningPath: LearningPath) => void;
  clearError: () => void;
}

export function useAuth(): UseAuth {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef<UserProfile | null>(null);

  const persistUser = useCallback(async (next: UserProfile | null): Promise<void> => {
    userRef.current = next;
    setUser(next);
    if (next) await storageSet(AUTH_USER_KEY, JSON.stringify(next));
    else await storageRemove(AUTH_USER_KEY);
  }, []);

  // Hidratación: lee el perfil cacheado del canal activo y resuelve loading.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const raw = await storageGet(AUTH_USER_KEY);
      if (!alive) return;
      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (isUserProfile(parsed)) {
            userRef.current = parsed;
            setUser(parsed);
          }
        } catch {
          // Perfil corrupto: arrancamos sin sesión.
        }
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string): Promise<UserProfile> => {
      setError(null);
      try {
        const res = await api.register(email, password, displayName);
        if (isOffline(res)) {
          const offlineUser = makeOfflineUser(email, displayName);
          await persistUser(offlineUser);
          return offlineUser;
        }
        await setTokens(res.accessToken, res.refreshToken);
        const profile: UserProfile = {
          userId: res.userId,
          email,
          displayName: defaultDisplayName(email, displayName),
          createdAt: nowIso(),
          lastSeenAt: nowIso(),
          learningPath: 'beginner',
          calibrationDone: false,
        };
        await persistUser(profile);
        return profile;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo completar el registro');
        throw e;
      }
    },
    [persistUser]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<UserProfile> => {
      setError(null);
      try {
        const res = await api.login(email, password);
        if (isOffline(res)) {
          const raw = await storageGet(AUTH_USER_KEY);
          let restored: UserProfile | null = null;
          if (raw) {
            try {
              const parsed: unknown = JSON.parse(raw);
              if (isUserProfile(parsed) && parsed.email === email) restored = parsed;
            } catch {
              // Ignoramos el perfil corrupto y creamos uno nuevo.
            }
          }
          const offlineUser = restored ?? makeOfflineUser(email);
          await persistUser(offlineUser);
          return offlineUser;
        }
        await setTokens(res.accessToken, res.refreshToken);
        const profile: UserProfile = {
          userId: res.userId,
          email,
          displayName: defaultDisplayName(email),
          createdAt: nowIso(),
          lastSeenAt: nowIso(),
          learningPath: 'beginner',
          calibrationDone: false,
        };
        await persistUser(profile);
        return profile;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Credenciales inválidas');
        throw e;
      }
    },
    [persistUser]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.logout();
    } catch {
      // El logout es best-effort: aunque el servidor falle, limpiamos local.
    }
    await clearTokens();
    await persistUser(null);
  }, [persistUser]);

  const completeCalibration = useCallback(
    (learningPath: LearningPath): void => {
      const current = userRef.current;
      if (!current) return;
      void persistUser({ ...current, calibrationDone: true, learningPath });
    },
    [persistUser]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    isAuthenticated: user !== null,
    loading,
    error,
    register,
    login,
    logout,
    completeCalibration,
    clearError,
  };
}
