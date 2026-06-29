// Avatar Worker (EGC-10) — GET / PATCH (architecture §2).
//
// El avatar mentor (NORA). GET crea uno por defecto si no existe. PATCH sólo permite cambiar
// `skin`/`mood`; una skin que no esté en `unlockedSkins` se rechaza con 422.
import { D1Helper, type AvatarRow } from '../../_db';
import { json, error, type Env, type PagesContext } from '../../_shared';

const VALID_MOODS = new Set(['neutral', 'encouraging', 'celebrating', 'concerned']);

function toAvatar(row: AvatarRow) {
  let unlockedSkins: string[] = ['default'];
  try {
    const parsed = JSON.parse(row.unlockedSkins);
    if (Array.isArray(parsed)) unlockedSkins = parsed as string[];
  } catch {
    // unlockedSkins corrupto: caemos al set por defecto.
  }
  return {
    userId: row.userId,
    skin: row.skin,
    mood: row.mood,
    xp: row.xp,
    unlockedSkins,
    lastInteractionAt: row.lastInteractionAt,
  };
}

async function ensureAvatar(db: D1Helper, userId: string): Promise<AvatarRow> {
  const existing = await db.getAvatar(userId);
  if (existing) return existing;
  const fresh: AvatarRow = {
    userId,
    skin: 'default',
    mood: 'neutral',
    xp: 0,
    unlockedSkins: JSON.stringify(['default']),
    lastInteractionAt: new Date().toISOString(),
  };
  await db.createAvatar(fresh);
  return fresh;
}

async function getAvatar(request: Request, db: D1Helper, userId: string): Promise<Response> {
  return json(toAvatar(await ensureAvatar(db, userId)), request, 200);
}

async function patchAvatar(request: Request, db: D1Helper, userId: string): Promise<Response> {
  const current = toAvatar(await ensureAvatar(db, userId));
  let skin = current.skin;
  let mood = current.mood;
  try {
    const body = (await request.json()) as { skin?: unknown; mood?: unknown };
    if (typeof body.skin === 'string') skin = body.skin;
    if (typeof body.mood === 'string') mood = body.mood;
  } catch {
    return error(request, 422, 'Cuerpo inválido', 'VALIDATION');
  }
  if (!current.unlockedSkins.includes(skin)) {
    return error(request, 422, 'Skin no desbloqueada', 'SKIN_LOCKED');
  }
  if (!VALID_MOODS.has(mood)) {
    return error(request, 422, 'Mood inválido', 'VALIDATION');
  }
  const iso = new Date().toISOString();
  await db.updateAvatar(userId, skin, mood, iso);
  return json({ ...current, skin, mood, lastInteractionAt: iso }, request, 200);
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const userId = typeof context.data.userId === 'string' ? context.data.userId : '';
  if (!userId) return error(request, 401, 'No autenticado', 'UNAUTHENTICATED');

  const db = new D1Helper((env as Env).DB);
  if (request.method === 'GET') return getAvatar(request, db, userId);
  if (request.method === 'PATCH') return patchAvatar(request, db, userId);
  return error(request, 405, 'Método no permitido', 'METHOD_NOT_ALLOWED');
}
