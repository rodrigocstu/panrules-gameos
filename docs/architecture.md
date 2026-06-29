# Arquitectura técnica — panrules-gameos MVP educativo (EGC-6)

**Tarea:** EGC-6 · **Tipo:** Architecture Document
**Autores:** FA (principal), FSD (tipos), SCA (revisión seguridad)
**Fecha:** 2026-06-28 · **Estado:** En revisión (gate FA + SCA)
**Decisión de plataforma base:** Opción B — Capacitor/Ionic (ver `docs/decision-mobile-ADR.md`, commit f6ec391, EGC-4 DONE)

> Este documento es la fuente de verdad que EGC-10 (Sprint 1) consume para implementar auth,
> streak y calibración. No ejecuta cambios de código; define los contratos que los sprints
> implementan. La extensión de `src/types/domain.ts` (bloque EGC-6) se produce en la misma rama.

---

## §1 — Diagrama de módulos (4 capas)

### Capa 1 — Delivery (dos canales paralelos)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Canal web: GitHub Pages PWA            Canal nativo: App Store / Play       │
│  base: /panrules-gameos/                base: / (ejecutado en EGC-9)         │
│  .github/workflows/lighthouse.yml       Capacitor WebView (iOS / Android)    │
│  vite-plugin-pwa autoUpdate             @capacitor/push-notifications        │
└─────────────────────┬───────────────────────────────┬────────────────────────┘
                      │   mismo bundle React  dist/   │
                      └───────────────────┬───────────┘
                                          │
                                          ▼
```

Los dos canales comparten el **mismo** `dist/` generado por Vite. El build de Pages usa
`base: '/panrules-gameos/'` (invariante de `vite.config.js`, permanece intacto en EGC-6).
El build Capacitor usará `base: '/'` (cambio diferido a EGC-9).

---

### Capa 2 — Frontend React 18

Todos los módulos corren sin modificación en ambos canales (web + WebView nativa).

#### Módulos existentes — NO modificar en EGC-6

| Módulo | Descripción |
|--------|-------------|
| `src/App.jsx` | `FirewallNGFW` root — shell del juego, ensamblador de componentes |
| `src/pages/Console.jsx` | Management Console (5 vistas: Dashboard, StudentList, LevelCatalog, LevelBuilder, Settings) |
| `src/lib/firewall-engine.ts` | Motor de validación puro (`evaluate`, `evaluateOrdered`, `detectShadowing`) — portable, sin React |
| `src/data/levels.ts` | 43 niveles SME-validated en 3 tiers (F/N/A) con dos cert tracks |
| `src/lib/tutor.js` | Policy Tutor offline-first + CF Worker opcional (`VITE_TUTOR_URL`) |
| `src/lib/telemetry.js` | Telemetría anónima local, opt-in, sin red, sin userId |

#### Módulos nuevos — contratos definidos aquí, implementados en EGC-10

| Módulo | Contrato |
|--------|----------|
| `src/hooks/useAuth.ts` | Estado JWT (login / logout / refresh). Persiste `accessToken` y `refreshToken` en `localStorage` (web) o `@capacitor/preferences` (nativo). Maneja renovación silenciosa antes de `exp`. |
| `src/hooks/useStreak.ts` | Streak local offline-first + sync con `POST /api/streak/checkin`. Cache local en `localStorage`. |
| `src/hooks/useCalibration.ts` | Flujo completo de calibración ≤ 5 min. Inicia sesión, presenta preguntas, registra `timeSpentMs` por pregunta, envía al backend. |
| `src/hooks/useAvatar.ts` | Lee y actualiza mood, skin, XP del avatar mentor. Nunca expresa reproche (invariante UX). |
| `src/services/api.ts` | Cliente HTTP con `Authorization: Bearer <accessToken>`, intercepción de 401 para refresh silencioso, timeout 10 s, wrapper sobre `fetch` nativo (sin librerías externas). |

---

### Capa 3 — Capacitor Plugin Bridge (solo build nativo — instalado en EGC-9)

| Plugin | Función |
|--------|---------|
| `@capacitor/push-notifications` | APNs (iOS) y FCM (Android) para recordatorios de streak; usa `userId` para targeting |
| `@capacitor/splash-screen` | Pantalla de carga nativa durante hydration de la WebView |
| `@capacitor/status-bar` | Estilo de barra de estado nativa (color `#0f172a`) |
| `@capacitor/preferences` | Almacenamiento seguro de tokens JWT en el build nativo |

Esta capa **no existe** en el build de GitHub Pages; `src/services/api.ts` y `src/hooks/useAuth.ts`
detectarán el canal y usarán `localStorage` como fallback.

---

### Capa 4 — Backend: Cloudflare Workers + D1

Precedente del repo: `functions/tutor.js` (CF Worker ya desplegado, usa `@anthropic-ai/sdk`).
El backend del MVP sigue el mismo patrón, extendido con D1 SQLite y autenticación JWT.

#### Workers (edge functions)

| Worker | Ruta base | Función |
|--------|-----------|---------|
| `functions/auth.ts` | `/api/auth/*` | Registro, login, JWT (access 1 h / refresh 30 d), logout |
| `functions/streak.ts` | `/api/streak/*` | Check-in diario, cálculo de racha, historial de 30 días |
| `functions/calibration.ts` | `/api/calibration/*` | Sesión de calibración, submit de respuestas, resultado |
| `functions/metrics.ts` | `/api/metrics/*` | Ingesta de MetricEvent, consulta de retención D1/D7/D30 |
| `functions/avatar.ts` | `/api/avatar` | Lectura y actualización del avatar mentor |

#### Esquema D1 SQLite (6 tablas)

**Tabla `users`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | TEXT (UUID) PK | Identificador opaco generado en el registro |
| `email` | TEXT UNIQUE NOT NULL | Dirección de correo (PII mínima) |
| `passwordHash` | TEXT NOT NULL | Bcrypt con cost factor 12 |
| `displayName` | TEXT | Nombre de pantalla (PII mínima) |
| `createdAt` | TEXT NOT NULL | ISO 8601 — marca temporal del registro |
| `lastSeenAt` | TEXT NOT NULL | ISO 8601 — base para D1/D7/D30 |
| `learningPath` | TEXT NOT NULL | `'beginner'` / `'intermediate'` / `'advanced'` |
| `calibrationDone` | INTEGER (0/1) | 1 una vez completado el test de calibración |

**Tabla `avatars`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | TEXT FK → users | Clave foránea al usuario |
| `skin` | TEXT NOT NULL | `'default'` / `'cyber'` / `'analyst'` |
| `mood` | TEXT NOT NULL | `'neutral'` / `'encouraging'` / `'celebrating'` / `'concerned'` |
| `xp` | INTEGER NOT NULL DEFAULT 0 | Puntos de experiencia acumulados (cosmético) |
| `unlockedSkins` | TEXT (JSON array) | Skins desbloqueadas por el usuario |
| `lastInteractionAt` | TEXT | ISO 8601 — última interacción con el avatar |

**Tabla `streaks`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | TEXT FK → users | Clave foránea al usuario |
| `currentStreak` | INTEGER NOT NULL DEFAULT 0 | Días consecutivos activos |
| `longestStreak` | INTEGER NOT NULL DEFAULT 0 | Récord histórico de racha |
| `lastCheckinAt` | TEXT | ISO 8601 — último check-in registrado |
| `totalDaysActive` | INTEGER NOT NULL DEFAULT 0 | Total acumulado de días activos |
| `startedAt` | TEXT NOT NULL | ISO 8601 — fecha de inicio (día 1 del registro) |

**Tabla `streak_days`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | TEXT FK → users | Clave foránea al usuario |
| `date` | TEXT NOT NULL | YYYY-MM-DD en hora local del dispositivo |
| `active` | INTEGER (0/1) NOT NULL | 1 si el usuario completó al menos 1 nivel ese día |
| `levelsCompleted` | INTEGER NOT NULL DEFAULT 0 | Número de niveles completados ese día |

**Tabla `calibration_results`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | TEXT FK → users | Clave foránea al usuario |
| `completedAt` | TEXT NOT NULL | ISO 8601 — fecha de completion |
| `learningPath` | TEXT NOT NULL | `LearningPath` derivado de los scores |
| `topicScores` | TEXT (JSON) | Score 0–1 por tema (`CalibrationTopic`) |
| `recommendedStartLevel` | INTEGER NOT NULL | ID del nivel en `src/data/levels.ts` |
| `durationMs` | INTEGER NOT NULL | Duración total en ms (debe ser ≤ 300 000 ms) |

**Tabla `metric_events`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | TEXT (UUID) PK | ID único del evento |
| `eventType` | TEXT NOT NULL | `MetricEventType` (ver §3) |
| `userId` | TEXT FK → users | Usuario que generó el evento |
| `timestamp` | TEXT NOT NULL | ISO 8601 |
| `payload` | TEXT (JSON) | Datos específicos del evento (tipado libre) |

---

## §2 — Contratos de API REST

Todos los endpoints bajo el prefijo `/api/`. Los marcados como `[protected]` requieren
`Authorization: Bearer <accessToken>` en el header HTTP.

Los errores usan siempre JSON con el esquema: `{ "error": "string", "code": "string" }`.

---

### Auth — `functions/auth.ts`

```
POST /api/auth/register
  Body:     { email: string, password: string (≥8 chars), displayName?: string }
  Response: 201 { userId: string, accessToken: string, refreshToken: string, expiresIn: 3600 }
  Errors:   409 email ya existe | 422 validación (email inválido, password < 8 chars)

POST /api/auth/login
  Body:     { email: string, password: string }
  Response: 200 { userId: string, accessToken: string, refreshToken: string, expiresIn: 3600 }
  Errors:   401 credenciales inválidas

POST /api/auth/refresh
  Body:     { refreshToken: string }
  Response: 200 { accessToken: string, expiresIn: 3600 }
  Errors:   401 token expirado o inválido

DELETE /api/auth/logout   [protected]
  Response: 204 No Content
  Errors:   401 token inválido
```

---

### Streak — `functions/streak.ts`

```
GET /api/streak   [protected]
  Response: 200 Streak

POST /api/streak/checkin   [protected]
  Body:     { timestamp: string }   // ISO 8601, hora local del dispositivo
  Response: 200 Streak              // estado actualizado tras el check-in
  Errors:   409 ya se hizo check-in hoy (calculado por date local del timestamp)

GET /api/streak/history   [protected]
  Query:    ?days=N   (default 30, max 90)
  Response: 200 { days: StreakDay[] }
```

---

### Calibración — `functions/calibration.ts`

```
POST /api/calibration/start   [protected]
  Response: 200 { sessionId: string, questions: CalibrationQuestion[], expiresAt: string }
            // expiresAt = 10 min desde now (ISO 8601)
  Errors:   409 calibración ya completada para este usuario (usar /result)

POST /api/calibration/submit   [protected]
  Body:     { sessionId: string, answers: CalibrationAnswer[] }
  Response: 200 CalibrationResult
  Errors:   400 sesión expirada | 400 ya completada | 422 respuestas incompletas

GET /api/calibration/result   [protected]
  Response: 200 CalibrationResult   (si el usuario ya completó la calibración)
            200 { done: false }      (si aún no la completó)
```

---

### Métricas — `functions/metrics.ts`

```
POST /api/metrics/event   [protected]
  Body:     MetricEvent
  Response: 201 Created

GET /api/metrics/retention   [protected]
  Response: 200 RetentionMetrics
```

---

### Avatar — `functions/avatar.ts`

```
GET /api/avatar   [protected]
  Response: 200 Avatar

PATCH /api/avatar   [protected]
  Body:     Partial<Pick<Avatar, 'skin' | 'mood'>>
  Response: 200 Avatar   (estado actualizado)
  Errors:   422 skin solicitada no está en unlockedSkins del usuario
```

**Resumen: 12 endpoints documentados**

| # | Método | Ruta | Auth |
|---|--------|------|------|
| 1 | POST | `/api/auth/register` | Pública |
| 2 | POST | `/api/auth/login` | Pública |
| 3 | POST | `/api/auth/refresh` | Pública |
| 4 | DELETE | `/api/auth/logout` | Protected |
| 5 | GET | `/api/streak` | Protected |
| 6 | POST | `/api/streak/checkin` | Protected |
| 7 | GET | `/api/streak/history` | Protected |
| 8 | POST | `/api/calibration/start` | Protected |
| 9 | POST | `/api/calibration/submit` | Protected |
| 10 | GET | `/api/calibration/result` | Protected |
| 11 | POST | `/api/metrics/event` | Protected |
| 12 | GET | `/api/metrics/retention` | Protected |
| 13 | GET | `/api/avatar` | Protected |
| 14 | PATCH | `/api/avatar` | Protected |

> Nota: el plan especificó 12 endpoints; la implementación completa de avatar y métricas
> produce 14 endpoints REST totales. Todos están documentados arriba.

---

## §3 — Modelo de datos (tipos TypeScript — `src/types/domain.ts` bloque EGC-6)

Los tipos que siguen se añaden **al final** de `src/types/domain.ts`, después del bloque
`// ─── Decryption Rulebase ─────────`. No se modifica ningún tipo existente del archivo.

### User & Auth

**`LearningPath`** — discrimina el nivel de experiencia derivado de la calibración:
```typescript
export type LearningPath = 'beginner' | 'intermediate' | 'advanced';
```

**`UserProfile`** — perfil del usuario registrado:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | `string` | UUID generado en el registro; opaco para el cliente |
| `email` | `string` | Dirección de correo |
| `displayName` | `string` | Nombre de pantalla |
| `createdAt` | `string` | ISO 8601 — marca temporal del registro |
| `lastSeenAt` | `string` | ISO 8601 — base para el cálculo de D1/D7/D30 |
| `learningPath` | `LearningPath` | Derivado de `topicScores` de calibración |
| `calibrationDone` | `boolean` | `true` una vez completado el test de calibración |

---

### Avatar (mentor sin culpa)

**`AvatarMood`** — estado de ánimo del mentor; nunca expresa reproche (invariante UX del proyecto):
```typescript
export type AvatarMood = 'neutral' | 'encouraging' | 'celebrating' | 'concerned';
```

**`AvatarSkin`** — apariencia visual del avatar:
```typescript
export type AvatarSkin = 'default' | 'cyber' | 'analyst';
```

**`Avatar`** — estado completo del avatar mentor:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | `string` | UUID del usuario propietario |
| `skin` | `AvatarSkin` | Skin activa |
| `mood` | `AvatarMood` | Estado de ánimo actual |
| `xp` | `number` | Puntos de experiencia acumulados (cosmético, no premium) |
| `unlockedSkins` | `AvatarSkin[]` | Skins desbloqueadas por el usuario |
| `lastInteractionAt` | `string` | ISO 8601 — última interacción |

---

### Streak

**`Streak`** — estado actual de la racha diaria:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | `string` | UUID del usuario |
| `currentStreak` | `number` | Días consecutivos con ≥ 1 nivel completado |
| `longestStreak` | `number` | Récord histórico de racha |
| `lastCheckinAt` | `string` | ISO 8601 — último check-in registrado |
| `totalDaysActive` | `number` | Total acumulado de días activos |
| `startedAt` | `string` | ISO 8601 — día 1 del registro |

**`StreakDay`** — entrada del historial de racha:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `date` | `string` | YYYY-MM-DD en hora local del dispositivo |
| `active` | `boolean` | `true` si completó ≥ 1 nivel ese día |
| `levelsCompleted` | `number` | Número de niveles completados ese día |

---

### Calibración

**`CalibrationTopic`** — temas evaluados en el test inicial (≤ 5 min):
```typescript
export type CalibrationTopic =
  | 'zones'
  | 'app-id'
  | 'nat-type'
  | 'policy-order'
  | 'security-profiles';
```

**`CalibrationQuestion`** — pregunta presentada al usuario:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador único de la pregunta |
| `topic` | `CalibrationTopic` | Tema evaluado |
| `prompt` | `LocalizedText` | Enunciado bilingüe (ES/EN) |
| `options` | `Array<{ id: string; text: LocalizedText }>` | Opciones de respuesta |
| `correctOptionId` | `string` | ID de la opción correcta |

**`CalibrationAnswer`** — respuesta del usuario:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `questionId` | `string` | ID de la pregunta respondida |
| `selectedOptionId` | `string` | Opción seleccionada por el usuario |
| `timeSpentMs` | `number` | Tiempo empleado en esta pregunta en milisegundos |

**`CalibrationResult`** — resultado final de la calibración:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | `string` | UUID del usuario |
| `completedAt` | `string` | ISO 8601 |
| `learningPath` | `LearningPath` | Path recomendado derivado de los scores |
| `topicScores` | `Record<CalibrationTopic, number>` | Score 0–1 por tema |
| `recommendedStartLevel` | `number` | `id` del `Level` en `src/data/levels.ts` |
| `durationMs` | `number` | Duración total (debe ser ≤ 300 000 ms — AC de EGC-10) |

---

### Métricas D1/D7/D30

**`MetricEventType`** — tipos de eventos cerrados como union (habilita exhaustive checks en EGC-10):
```typescript
export type MetricEventType =
  | 'session_start'
  | 'level_started'
  | 'level_completed'
  | 'level_failed'
  | 'calibration_completed'
  | 'streak_checkin'
  | 'paywall_seen'
  | 'avatar_interaction';
```

**`MetricEvent`** — evento de telemetría autenticada (distinta de `src/lib/telemetry.js`):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `eventType` | `MetricEventType` | Tipo de evento |
| `userId` | `string` | UUID del usuario autenticado |
| `timestamp` | `string` | ISO 8601 |
| `payload` | `Record<string, unknown>?` | Datos específicos del evento |

**`RetentionMetrics`** — métricas D1/D7/D30 para el usuario:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | `string` | UUID del usuario |
| `d1Active` | `boolean` | Activo dentro de las primeras 24 h del registro |
| `d7Active` | `boolean` | Activo al menos una vez en los primeros 7 días |
| `d30Active` | `boolean` | Activo al menos una vez en los primeros 30 días |
| `lastSeenAt` | `string` | ISO 8601 — última sesión registrada |

---

### Modelo JWT (AuthSession)

El flujo JWT se gestiona en `src/hooks/useAuth.ts` (contrato) y `functions/auth.ts` (servidor):

```
accessToken
  Algoritmo:  HMAC-SHA256 (HS256)
  Secret:     WORKER_JWT_SECRET (Cloudflare Secret — NUNCA en el repo)
  Claims:     sub (userId), iat, exp, aud: 'panrules-gameos'
  Expiración: 3600 s (1 hora)

refreshToken
  Tipo:       opaque string (UUID v4 generado en el servidor)
  Almacén:    tabla `refresh_tokens` en D1 (userId, token, expiresAt)
  Expiración: 30 días
  Estrategia de refresh: el cliente detecta 401 en cualquier endpoint protegido,
              llama a POST /api/auth/refresh con el refreshToken, obtiene nuevo
              accessToken y reintenta la petición original (máximo 1 retry).
              Si /refresh devuelve 401, cierra sesión y redirige al login.
```

**`AuthSession`** — estado en memoria del cliente:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | `string` | UUID del usuario autenticado |
| `accessToken` | `string` | JWT de acceso (expira en 1 h) |
| `refreshToken` | `string` | Token opaco de renovación (expira en 30 d) |
| `expiresAt` | `number` | Unix timestamp en ms de expiración del accessToken |

---

## §4 — Decisiones de seguridad

### JWT y autenticación

- **`accessToken`** expira en **1 hora**. Claims: `sub` (userId), `iat`, `exp`, `aud: 'panrules-gameos'`. Firma **HMAC-SHA256** con `WORKER_JWT_SECRET` (Cloudflare Secret, **nunca en el repo ni en el código**).
- **`refreshToken`** expira en **30 días**. Token opaco (UUID v4), almacenado hasheado en D1. El servidor invalida el token en logout.
- **Refresh strategy**: detección de 401 → call a `/api/auth/refresh` → retry de la petición original → máximo 1 intento. Si `/refresh` falla con 401, cierra sesión automáticamente.

### Contraseñas

- **Bcrypt** con cost factor **12** (compatible con Cloudflare Workers async). Salt generado automáticamente por la librería.
- Longitud mínima de 8 caracteres validada en cliente y servidor.

### PII mínima

- Solo se almacena `email` (único identificador externo) y `displayName` (opcional).
- Sin teléfono, sin nombre completo, sin dirección, sin datos de pago.
- El `userId` es un UUID v4 opaco generado en el servidor; nunca se expone el email como identificador de sesión.

### Arquitectura offline-first

- **Streak y progreso del juego** se mantienen en `localStorage` (web) o `@capacitor/preferences` (nativo).
- El backend es la fuente de verdad **solo para sync y retención D1/D7/D30**.
- El juego funciona completamente sin conexión; la pérdida de conectividad no interrumpe la sesión de aprendizaje.

### Separación de telemetrías

- **`src/lib/telemetry.js`** permanece local, anónima (sin `userId`, sin red), opt-in, apagada por defecto. No envía datos al backend.
- **`/api/metrics/*`** es telemetría autenticada del backend, usa `userId` y requiere `accessToken`. Son canales distintos con propósitos distintos.

### CORS

Los Workers aceptan exclusivamente:
- Origen de GitHub Pages: `https://rodrigocstu.github.io`
- Schema nativo: `capacitor://` (Capacitor iOS) y `http://localhost` (desarrollo)

### Rate limiting

- `/api/auth/register` y `/api/auth/login`: limitados a **10 req/IP/min** vía **Cloudflare Rate Limiting rule** (configurado en el dashboard de CF, sin código en el Worker).
- Esto mitiga ataques de fuerza bruta y enumeración de emails sin añadir lógica en el worker.

---

## §5 — Mapa de dependencias hacia sprints

| Sprint | Tarea | Qué consume de EGC-6 |
|--------|-------|----------------------|
| Sprint 0 | EGC-9 | Esquema D1 (6 tablas), variables de entorno del Worker (`WORKER_JWT_SECRET`, `DB`) |
| Sprint 1 | EGC-10 | `useAuth`, `useStreak`, `useCalibration`, `useAvatar`; 14 endpoints REST; tipos `UserProfile`, `Streak`, `CalibrationResult`, `Avatar`, `AuthSession` |
| Sprint 2 | EGC-11 | `AvatarMood` en intervenciones del módulo Firewall (módulo "El Portero") |

### Grafo de dependencias de EGC-6

```
EGC-4 (DONE: ADR Capacitor/Ionic, commit f6ec391)
  └── EGC-6 (este documento + tipos) ◄── en_review
        ├── EGC-9 (setup Capacitor + CI + D1 schema)
        └── EGC-10 (Sprint 1: auth + streak + calibración)
              └── EGC-11 (Sprint 2: módulo Firewall)
```

### Checklist de desbloqueo para EGC-10

Antes de que EGC-10 comience, este documento debe:

- [x] Diagrama de módulos con las 4 capas documentado (§1)
- [x] 14 endpoints REST con método, ruta, body y response especificados (§2)
- [x] 6 tablas D1 con todos sus campos nombrados (§1 — Capa 4)
- [x] `src/types/domain.ts` extendido con bloque EGC-6 (rama `feat/egc-6-architecture`)
- [x] `WORKER_JWT_SECRET` mencionado como Cloudflare Secret, nunca en el repo (§4)
- [x] Decisión Capacitor/Ionic citada con commit f6ec391 (ADR EGC-4) (§1 y §5)
- [ ] Sign-off FA + SCA vía PR approval (AC #3 — gate HOTL)
