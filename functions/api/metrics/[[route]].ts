// Metrics Worker (EGC-10) — event / retention (architecture §2).
//
// Telemetría autenticada del backend (distinta de `src/lib/telemetry.js`, que es anónima y
// local). El `userId` proviene SIEMPRE del token (no del cuerpo) para no aceptar identidades
// suplantadas. La retención D1/D7/D30 se aproxima como "activo en los últimos N días" (MVP).
import { D1Helper } from '../../_db';
import { json, error, uuid, type Env, type PagesContext } from '../../_shared';

const VALID_EVENTS = new Set([
  'session_start',
  'level_started',
  'level_completed',
  'level_failed',
  'calibration_completed',
  'streak_checkin',
  'paywall_seen',
  'avatar_interaction',
]);

function lastSegment(url: string): string {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

async function event(request: Request, db: D1Helper, userId: string): Promise<Response> {
  let eventType = '';
  let timestamp = new Date().toISOString();
  let payload: unknown = {};
  try {
    const body = (await request.json()) as {
      eventType?: unknown;
      timestamp?: unknown;
      payload?: unknown;
    };
    eventType = typeof body.eventType === 'string' ? body.eventType : '';
    if (typeof body.timestamp === 'string') timestamp = body.timestamp;
    payload = body.payload ?? {};
  } catch {
    return error(request, 422, 'Cuerpo inválido', 'VALIDATION');
  }
  if (!VALID_EVENTS.has(eventType)) {
    return error(request, 422, 'eventType desconocido', 'VALIDATION');
  }
  await db.createMetricEvent(uuid(), eventType, userId, timestamp, JSON.stringify(payload));
  return json({ ok: true }, request, 201);
}

async function retention(request: Request, db: D1Helper, userId: string): Promise<Response> {
  const user = await db.getUserById(userId);
  const now = Date.now();
  const since = (ms: number) => new Date(now - ms).toISOString();
  const day = 86_400_000;
  const [d1, d7, d30] = await Promise.all([
    db.countActiveSince(userId, since(day)),
    db.countActiveSince(userId, since(7 * day)),
    db.countActiveSince(userId, since(30 * day)),
  ]);
  return json(
    {
      userId,
      d1Active: d1 > 0,
      d7Active: d7 > 0,
      d30Active: d30 > 0,
      lastSeenAt: user?.lastSeenAt ?? new Date(now).toISOString(),
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

  if (request.method === 'POST' && action === 'event') return event(request, db, userId);
  if (request.method === 'GET' && action === 'retention') return retention(request, db, userId);
  return error(request, 405, 'Método no permitido', 'METHOD_NOT_ALLOWED');
}
