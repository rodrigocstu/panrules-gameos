// Streak Worker (EGC-10) — GET / checkin / history (architecture §2).
//
// Invariante ZT §4.5: el incremento de racha se calcula SIEMPRE server-side desde
// `lastCheckinAt` en D1; el valor de racha que envíe el cliente se ignora. Mismo día → 409
// (idempotente); día consecutivo → +1; hueco > 1 día → reinicia a 1.
import { D1Helper, type StreakRow } from '../../_db';
import { json, error, dateKeyOf, type Env, type PagesContext } from '../../_shared';

/** Tope de tokens de congelación acumulables (EGC-12); igual a src/lib/streak-freeze.ts. */
const MAX_FREEZE_TOKENS = 3;

function lastSegment(url: string): string {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

function daysBetweenKeys(fromKey: string, toKey: string): number {
  return Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / 86_400_000);
}

function toStreak(row: StreakRow) {
  return {
    userId: row.userId,
    currentStreak: row.currentStreak,
    longestStreak: row.longestStreak,
    lastCheckinAt: row.lastCheckinAt,
    totalDaysActive: row.totalDaysActive,
    startedAt: row.startedAt,
    freezeTokens: row.freezeTokens,
  };
}

async function readTimestamp(request: Request): Promise<string> {
  try {
    const body = (await request.json()) as { timestamp?: unknown };
    return typeof body?.timestamp === 'string' ? body.timestamp : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

async function getStreak(request: Request, db: D1Helper, userId: string): Promise<Response> {
  const row = await db.getStreak(userId);
  if (!row) return error(request, 404, 'Sin racha para este usuario', 'NOT_FOUND');
  return json(toStreak(row), request, 200);
}

async function checkin(request: Request, db: D1Helper, userId: string): Promise<Response> {
  const row = await db.getStreak(userId);
  if (!row) return error(request, 404, 'Sin racha para este usuario', 'NOT_FOUND');

  const nowIso = await readTimestamp(request);
  const todayKey = dateKeyOf(nowIso);
  const lastKey = row.lastCheckinAt ? dateKeyOf(row.lastCheckinAt) : '';

  if (lastKey === todayKey) {
    return error(request, 409, 'Ya se hizo check-in hoy', 'ALREADY_CHECKED_IN');
  }

  const gap = lastKey ? daysBetweenKeys(lastKey, todayKey) : 1;
  const currentStreak = gap === 1 ? row.currentStreak + 1 : 1;
  // Grant atómico de Freeze en hito (cada 7 días), con tope. Fuente de verdad servidor (ZT §4.5).
  const earnedFreeze = currentStreak % 7 === 0 && row.freezeTokens < MAX_FREEZE_TOKENS;
  const updated: StreakRow = {
    ...row,
    currentStreak,
    longestStreak: Math.max(row.longestStreak, currentStreak),
    totalDaysActive: row.totalDaysActive + 1,
    lastCheckinAt: nowIso,
    freezeTokens: earnedFreeze ? row.freezeTokens + 1 : row.freezeTokens,
  };
  await db.updateStreak(updated);
  await db.upsertStreakDay({ userId, date: todayKey, active: 1, levelsCompleted: 1, isFreeze: 0 });
  return json(toStreak(updated), request, 200);
}

/**
 * POST /freeze {action:'use'|'earn'} — Streak-Freeze (EGC-12, AC#3). Validación server-side
 * autoritativa (ZT §4.5): `use` exige token > 0 y racha rota (gap ≥ 2, sin actividad hoy) y
 * preserva currentStreak; `earn` respeta el tope. Espeja src/lib/streak-freeze.ts.
 */
async function freeze(request: Request, db: D1Helper, userId: string): Promise<Response> {
  const row = await db.getStreak(userId);
  if (!row) return error(request, 404, 'Sin racha para este usuario', 'NOT_FOUND');

  let action: 'use' | 'earn' = 'use';
  try {
    const body = (await request.json()) as { action?: unknown };
    if (body?.action === 'earn') action = 'earn';
  } catch {
    // Cuerpo ausente o inválido: por defecto 'use'.
  }

  if (action === 'earn') {
    if (row.freezeTokens >= MAX_FREEZE_TOKENS) {
      return error(request, 409, 'Tope de tokens alcanzado', 'FREEZE_CAP');
    }
    const updated: StreakRow = { ...row, freezeTokens: row.freezeTokens + 1 };
    await db.updateStreak(updated);
    return json(toStreak(updated), request, 200);
  }

  // action === 'use'
  if (row.freezeTokens <= 0) {
    return error(request, 409, 'No hay tokens de congelación', 'NO_FREEZE_TOKENS');
  }
  const nowIso = new Date().toISOString();
  const todayKey = dateKeyOf(nowIso);
  const lastKey = row.lastCheckinAt ? dateKeyOf(row.lastCheckinAt) : '';
  if (lastKey === todayKey) {
    return error(request, 409, 'Ya hay actividad hoy; no procede congelar', 'ALREADY_ACTIVE');
  }
  const gap = lastKey ? daysBetweenKeys(lastKey, todayKey) : 1;
  if (gap < 2) {
    return error(request, 409, 'La racha no está rota; no procede congelar', 'NOT_BROKEN');
  }
  // Preserva currentStreak (es lo que protege el freeze), puentea lastCheckinAt a hoy y registra
  // el día como cubierto por Freeze (isFreeze=1, sin nivel completado).
  const updated: StreakRow = {
    ...row,
    freezeTokens: row.freezeTokens - 1,
    totalDaysActive: row.totalDaysActive + 1,
    lastCheckinAt: nowIso,
  };
  await db.updateStreak(updated);
  await db.upsertStreakDay({ userId, date: todayKey, active: 1, levelsCompleted: 0, isFreeze: 1 });
  return json(toStreak(updated), request, 200);
}

async function history(request: Request, db: D1Helper, userId: string): Promise<Response> {
  const requested = Number.parseInt(new URL(request.url).searchParams.get('days') ?? '30', 10);
  const days = Math.min(Math.max(Number.isFinite(requested) ? requested : 30, 1), 90);
  const rows = await db.getStreakHistory(userId, days);
  return json(
    {
      days: rows.map((r) => ({
        date: r.date,
        active: r.active === 1,
        levelsCompleted: r.levelsCompleted,
      })),
    },
    request,
    200
  );
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const userId = typeof context.data.userId === 'string' ? context.data.userId : '';
  if (!userId) return error(request, 401, 'No autenticado', 'UNAUTHENTICATED');

  const db = new D1Helper((env as Env).DB);
  const action = lastSegment(request.url);

  if (request.method === 'POST' && action === 'checkin') return checkin(request, db, userId);
  if (request.method === 'POST' && action === 'freeze') return freeze(request, db, userId);
  if (request.method === 'GET' && action === 'history') return history(request, db, userId);
  if (request.method === 'GET') return getStreak(request, db, userId);
  return error(request, 405, 'Método no permitido', 'METHOD_NOT_ALLOWED');
}
