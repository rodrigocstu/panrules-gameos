// Middleware de Pages Functions (EGC-10) — verificación JWT (invariante ZT §4.1) + CORS.
//
// Corre para TODAS las rutas bajo functions/. Las públicas (register/login/refresh) pasan;
// el resto exige `Authorization: Bearer <accessToken>` válido y adjunta el `userId` a
// `context.data` para los handlers. Es agnóstico al prefijo de montaje (/api/… o /…): clasifica
// por los segmentos finales de la ruta, de modo que DOps puede montar los handlers donde el
// despliegue lo requiera sin tocar esta lógica.
import { verifyAccessToken, corsHeaders, error, type PagesContext } from './_shared';

function classify(pathname: string): { action: string; domain: string } {
  const segments = pathname.split('/').filter(Boolean);
  return {
    action: segments[segments.length - 1] ?? '',
    domain: segments.includes('auth') ? 'auth' : (segments[segments.length - 2] ?? ''),
  };
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  // Preflight CORS.
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const { action, domain } = classify(new URL(request.url).pathname);
  const isPublic =
    domain === 'auth' && (action === 'register' || action === 'login' || action === 'refresh');
  if (isPublic) {
    return context.next();
  }

  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return error(request, 401, 'Falta el token de acceso', 'UNAUTHENTICATED');
  }

  const userId = await verifyAccessToken(token, env.WORKER_JWT_SECRET);
  if (!userId) {
    return error(request, 401, 'Token inválido o expirado', 'UNAUTHENTICATED');
  }

  context.data.userId = userId;
  return context.next();
}
