// Auth Worker (EGC-10) — register / login / refresh / logout (architecture §2).
//
// Catch-all de Pages para `/api/auth/*`. PBKDF2 para contraseñas, JWT HS256 (1 h) de acceso y
// refresh token opaco (UUID) guardado hasheado en D1 (30 d). El registro inicializa la racha
// en 1 (server-side) y emite la sesión. El secreto viene de `env.WORKER_JWT_SECRET`.
import { D1Helper } from '../../_db';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  sha256,
  uuid,
  json,
  error,
  noContent,
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_SEC,
  type Env,
  type PagesContext,
} from '../../_shared';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function lastSegment(url: string): string {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return body ?? {};
  } catch {
    return {};
  }
}

async function issueSession(
  db: D1Helper,
  env: Env,
  userId: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await signAccessToken(userId, env.WORKER_JWT_SECRET);
  const refreshToken = uuid();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000).toISOString();
  await db.storeRefreshToken(userId, await sha256(refreshToken), expiresAt);
  return { accessToken, refreshToken };
}

async function register(request: Request, env: Env, db: D1Helper): Promise<Response> {
  const body = await readBody(request);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const displayName =
    typeof body.displayName === 'string' && body.displayName.trim()
      ? body.displayName.trim()
      : email.split('@')[0];

  if (!EMAIL_RE.test(email) || password.length < 8) {
    return error(request, 422, 'Email inválido o contraseña < 8 caracteres', 'VALIDATION');
  }
  if (await db.getUserByEmail(email)) {
    return error(request, 409, 'El email ya está registrado', 'EMAIL_EXISTS');
  }

  const userId = uuid();
  const nowIso = new Date().toISOString();
  await db.createUser({
    userId,
    email,
    passwordHash: await hashPassword(password),
    displayName,
    createdAt: nowIso,
    lastSeenAt: nowIso,
    learningPath: 'beginner',
    calibrationDone: 0,
  });
  // Inicializa la racha en 1 server-side (AC#3 / invariante 5).
  await db.createStreak({
    userId,
    currentStreak: 1,
    longestStreak: 1,
    lastCheckinAt: nowIso,
    totalDaysActive: 1,
    startedAt: nowIso,
  });

  const { accessToken, refreshToken } = await issueSession(db, env, userId);
  return json({ userId, accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SEC }, request, 201);
}

async function login(request: Request, env: Env, db: D1Helper): Promise<Response> {
  const body = await readBody(request);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  const user = await db.getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return error(request, 401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');
  }
  const { accessToken, refreshToken } = await issueSession(db, env, user.userId);
  return json(
    { userId: user.userId, accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SEC },
    request,
    200
  );
}

async function refresh(request: Request, env: Env, db: D1Helper): Promise<Response> {
  const body = await readBody(request);
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : '';
  if (!refreshToken) {
    return error(request, 401, 'Falta el refresh token', 'UNAUTHENTICATED');
  }
  const record = await db.getRefreshToken(await sha256(refreshToken));
  if (!record || new Date(record.expiresAt).getTime() <= Date.now()) {
    return error(request, 401, 'Refresh token inválido o expirado', 'UNAUTHENTICATED');
  }
  const accessToken = await signAccessToken(record.userId, env.WORKER_JWT_SECRET);
  return json({ accessToken, expiresIn: ACCESS_TOKEN_TTL_SEC }, request, 200);
}

async function logout(context: PagesContext, db: D1Helper): Promise<Response> {
  const userId = typeof context.data.userId === 'string' ? context.data.userId : '';
  if (userId) await db.deleteRefreshTokensForUser(userId);
  return noContent(context.request);
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const action = lastSegment(request.url);
  const db = new D1Helper(env.DB);

  if (request.method === 'POST' && action === 'register') return register(request, env, db);
  if (request.method === 'POST' && action === 'login') return login(request, env, db);
  if (request.method === 'POST' && action === 'refresh') return refresh(request, env, db);
  if (request.method === 'DELETE' && action === 'logout') return logout(context, db);
  return error(request, 405, 'Método no permitido', 'METHOD_NOT_ALLOWED');
}
