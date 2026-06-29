// Cliente HTTP del MVP (EGC-10) — wrapper fino sobre `fetch`, sin librerías externas.
//
// Contrato offline-first (igual que `PolicyTutor` cuando `VITE_TUTOR_URL` no está):
// si `VITE_API_URL` está vacío, NINGÚN método toca la red — todos devuelven
// `{ offline: true }` y el hook llamador cae a `localStorage`. Con base URL presente,
// adjunta `Authorization: Bearer <accessToken>` (leído del token store consciente del
// canal) y, ante un 401, intenta UN refresh silencioso y reintenta la petición; si el
// refresh también falla, limpia la sesión y lanza `AuthError` (architecture.md §2/§4).
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../lib/tokenStore';
import type { CalibrationAnswer, CalibrationResult, Streak, StreakDay } from '../types/domain';
import type { CohortRetentionResult } from '../lib/retention';

const DEFAULT_TIMEOUT_MS = 10_000;

/** Respuesta centinela cuando el cliente opera sin backend (canal offline). */
export interface OfflineResult {
  offline: true;
}

export function isOffline(value: unknown): value is OfflineResult {
  return typeof value === 'object' && value !== null && (value as OfflineResult).offline === true;
}

/** Se lanza cuando la sesión expiró y el refresh silencioso no la pudo renovar. */
export class AuthError extends Error {
  constructor(message = 'Sesión expirada') {
    super(message);
    this.name = 'AuthError';
  }
}

/** Error de API con código de estado HTTP para que el hook decida el mensaje al usuario. */
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export interface AuthResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

const PUBLIC_PATHS = new Set(['/api/auth/register', '/api/auth/login', '/api/auth/refresh']);

export class ApiClient {
  readonly baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || '') {
    this.baseURL = baseURL;
  }

  /** true sólo si hay un backend configurado; en false todo degrada a offline. */
  get online(): boolean {
    return this.baseURL !== '';
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────
  async register(
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResponse | OfflineResult> {
    if (!this.online) return { offline: true };
    return this.json<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse | OfflineResult> {
    if (!this.online) return { offline: true };
    return this.json<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refresh(): Promise<RefreshResponse | OfflineResult> {
    if (!this.online) return { offline: true };
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new AuthError('No hay refresh token');
    return this.json<RefreshResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(): Promise<{ ok: true } | OfflineResult> {
    if (!this.online) return { offline: true };
    await this.authed('/api/auth/logout', { method: 'DELETE' });
    return { ok: true };
  }

  // ─── Streak ────────────────────────────────────────────────────────────────
  async getStreak(): Promise<Streak | OfflineResult> {
    if (!this.online) return { offline: true };
    return this.authedJson<Streak>('/api/streak', { method: 'GET' });
  }

  async checkin(timestamp: string): Promise<Streak | OfflineResult> {
    if (!this.online) return { offline: true };
    return this.authedJson<Streak>('/api/streak/checkin', {
      method: 'POST',
      body: JSON.stringify({ timestamp }),
    });
  }

  async getStreakHistory(days = 30): Promise<{ days: StreakDay[] } | OfflineResult> {
    if (!this.online) return { offline: true };
    return this.authedJson<{ days: StreakDay[] }>(`/api/streak/history?days=${days}`, {
      method: 'GET',
    });
  }

  /**
   * Streak-Freeze (EGC-12): `use` gasta un token para proteger una racha rota; `earn`
   * registra la intención de ganar uno. El servidor valida autoritativamente (no usar si 0,
   * no exceder el tope) y devuelve la racha actualizada (ZT §4.5).
   */
  async freeze(action: 'use' | 'earn'): Promise<Streak | OfflineResult> {
    if (!this.online) return { offline: true };
    return this.authedJson<Streak>('/api/streak/freeze', {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  // ─── Calibración ─────────────────────────────────────────────────────────────
  async submitCalibration(
    answers: CalibrationAnswer[],
    sessionId?: string
  ): Promise<CalibrationResult | OfflineResult> {
    if (!this.online) return { offline: true };
    return this.authedJson<CalibrationResult>('/api/calibration/submit', {
      method: 'POST',
      body: JSON.stringify({ sessionId, answers }),
    });
  }

  async getCalibrationResult(): Promise<CalibrationResult | { done: false } | OfflineResult> {
    if (!this.online) return { offline: true };
    return this.authedJson<CalibrationResult | { done: false }>('/api/calibration/result', {
      method: 'GET',
    });
  }

  // ─── Métricas (admin) ──────────────────────────────────────────────────────
  /**
   * Retención D3 de cohorte (EGC-12, instrumento de AC#1). Endpoint admin-gated; offline →
   * centinela. `window` por defecto 3 días tras el registro.
   */
  async getCohortRetention(window = 3): Promise<CohortRetentionResult | OfflineResult> {
    if (!this.online) return { offline: true };
    return this.authedJson<CohortRetentionResult>(
      `/api/metrics/cohort-retention?window=${window}`,
      { method: 'GET' }
    );
  }

  // ─── Internos ────────────────────────────────────────────────────────────────
  private async rawFetch(path: string, init: RequestInit, token?: string | null): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (token && !PUBLIC_PATHS.has(path.split('?')[0])) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    try {
      return await fetch(`${this.baseURL}${path}`, { ...init, headers, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  private async parse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let code: string | undefined;
      let message = `HTTP ${res.status}`;
      try {
        const body = (await res.json()) as { error?: string; code?: string };
        message = body.error ?? message;
        code = body.code;
      } catch {
        // respuesta sin cuerpo JSON: usamos el status como mensaje.
      }
      throw new ApiError(res.status, message, code);
    }
    return (await res.json()) as T;
  }

  /** Petición pública (sin bearer ni reintento de refresh). */
  private async json<T>(path: string, init: RequestInit): Promise<T> {
    return this.parse<T>(await this.rawFetch(path, init));
  }

  /** Petición protegida: adjunta bearer y reintenta una vez tras refresh ante 401. */
  private async authed(path: string, init: RequestInit): Promise<Response> {
    let res = await this.rawFetch(path, init, await getAccessToken());
    if (res.status === 401) {
      const renewed = await this.trySilentRefresh();
      if (!renewed) {
        await clearTokens();
        throw new AuthError();
      }
      res = await this.rawFetch(path, init, await getAccessToken());
    }
    return res;
  }

  private async authedJson<T>(path: string, init: RequestInit): Promise<T> {
    return this.parse<T>(await this.authed(path, init));
  }

  private async trySilentRefresh(): Promise<boolean> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;
    const res = await this.rawFetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as RefreshResponse;
    await setTokens(body.accessToken);
    return true;
  }
}

/** Instancia compartida configurada desde `VITE_API_URL`. */
export const api = new ApiClient();
