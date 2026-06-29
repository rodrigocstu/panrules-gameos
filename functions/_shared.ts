// Utilidades compartidas de los Workers (EGC-10) — Cloudflare Pages Functions + D1.
//
// Sin dependencias npm pesadas: todo el cripto usa Web Crypto (`crypto.subtle`), nativo en
// el runtime de Workers. El prefijo `_` excluye este módulo del file-routing de Pages.
//
// Hashing de contraseñas: PBKDF2-HMAC-SHA256, 100 000 iteraciones (directiva de la tarea —
// el runtime de Workers no trae bcrypt nativo; DESVÍA de architecture §4 "bcrypt cost 12" y
// requiere sign-off de SCA en el PR). JWT de acceso: HS256 con `WORKER_JWT_SECRET` (Secret de
// Cloudflare, nunca en el repo). El refresh token es un UUID opaco hasheado en D1 (architecture §4).

// ─── Tipos mínimos del entorno (evitan depender de @cloudflare/workers-types) ───────────────
export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface Env {
  DB: D1Database;
  /** Secret de Cloudflare — JAMÁS hardcodeado ni en [vars]. */
  WORKER_JWT_SECRET: string;
}

export interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  data: Record<string, unknown>;
  next: () => Promise<Response>;
}

export const ACCESS_TOKEN_TTL_SEC = 3600; // 1 h (architecture §4)
export const REFRESH_TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30 d
const PBKDF2_ITERATIONS = 100_000;
const JWT_AUDIENCE = 'panrules-gameos';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ─── base64url ────────────────────────────────────────────────────────────────────────────
function bytesToB64url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function strToB64url(value: string): string {
  return bytesToB64url(encoder.encode(value));
}

function b64urlToStr(value: string): string {
  return decoder.decode(b64urlToBytes(value));
}

/** Comparación en tiempo constante (mitiga timing attacks sobre firmas/hashes). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export function uuid(): string {
  return crypto.randomUUID();
}

// ─── Contraseñas (PBKDF2-HMAC-SHA256) ───────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToB64url(salt)}$${bytesToB64url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(iterations)) return false;
  const salt = b64urlToBytes(parts[2]);
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return timingSafeEqual(bytesToB64url(new Uint8Array(bits)), parts[3]);
}

/** Hash SHA-256 (para guardar el refresh token opaco hasheado en D1). */
export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return bytesToB64url(new Uint8Array(digest));
}

// ─── JWT HS256 ───────────────────────────────────────────────────────────────────────────────
async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return bytesToB64url(new Uint8Array(signature));
}

export async function signAccessToken(userId: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = strToB64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = strToB64url(
    JSON.stringify({ sub: userId, iat: now, exp: now + ACCESS_TOKEN_TTL_SEC, aud: JWT_AUDIENCE })
  );
  const data = `${header}.${payload}`;
  return `${data}.${await hmacSign(data, secret)}`;
}

/** Verifica firma + exp + aud. Devuelve el `userId` (sub) o null. */
export async function verifyAccessToken(token: string, secret: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const expected = await hmacSign(data, secret);
  if (!timingSafeEqual(expected, parts[2])) return null;
  try {
    const payload = JSON.parse(b64urlToStr(parts[1])) as {
      sub?: unknown;
      exp?: unknown;
      aud?: unknown;
    };
    if (payload.aud !== JWT_AUDIENCE) return null;
    if (typeof payload.exp === 'number' && Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

// ─── CORS y respuestas (architecture §4) ──────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  'https://rodrigocstu.github.io',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:5173',
]);

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://rodrigocstu.github.io';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export function json(data: unknown, request: Request, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}

export function error(request: Request, status: number, message: string, code: string): Response {
  return json({ error: message, code }, request, status);
}

export function noContent(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

/** Fecha local YYYY-MM-DD de un instante ISO (para los días de racha). */
export function dateKeyOf(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}
