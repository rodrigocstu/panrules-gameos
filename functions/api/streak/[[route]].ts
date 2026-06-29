// Streak Worker (EGC-10) — GET / checkin / history (architecture §2).
//
// Invariante ZT §4.5: el incremento de racha se calcula SIEMPRE server-side desde
// `lastCheckinAt` en D1; el valor de racha que envíe el cliente se ignora. Mismo día → 409
// (idempotente); día consecutivo → +1; hueco > 1 día → reinicia a 1.
import { D1Helper, type StreakRow } from '../../_db';
import { json, error, dateKeyOf, type Env, type PagesContext } from '../../_shared';

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
  const updated: StreakRow = {
    ...row,
    currentStreak,
    longestStreak: Math.max(row.longestStreak, currentStreak),
    totalDaysActive: row.totalDaysActive + 1,
    lastCheckinAt: nowIso,
  };
  await db.updateStreak(updated);
  await db.upsertStreakDay({ userId, date: todayKey, active: 1, levelsCompleted: 1 });
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
  if (request.method === 'GET' && action === 'history') return history(request, db, userId);
  if (request.method === 'GET') return getStreak(request, db, userId);
  return error(request, 405, 'Método no permitido', 'METHOD_NOT_ALLOWED');
}
