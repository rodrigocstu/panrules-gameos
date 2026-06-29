-- EGC-10 — esquema inicial D1 (architecture.md §3).
--
-- Columnas en camelCase para coincidir VERBATIM con los tipos del dominio EGC-6
-- (src/types/domain.ts), mapeo 1:1 sin conversión snake_case. Aplicar con:
--   wrangler d1 migrations apply edugame-db --local   (o --remote en producción)
-- `database_id` y el secret WORKER_JWT_SECRET son pasos DOps (ver wrangler.toml).

CREATE TABLE IF NOT EXISTS users (
  userId          TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  passwordHash    TEXT NOT NULL,
  displayName     TEXT,
  createdAt       TEXT NOT NULL,
  lastSeenAt      TEXT NOT NULL,
  learningPath    TEXT NOT NULL DEFAULT 'beginner',
  calibrationDone INTEGER NOT NULL DEFAULT 0
);

-- Refresh tokens opacos (UUID) guardados HASHEADOS (SHA-256); el servidor los invalida en logout.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  tokenHash TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES users(userId),
  expiresAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(userId);

CREATE TABLE IF NOT EXISTS avatars (
  userId            TEXT PRIMARY KEY REFERENCES users(userId),
  skin              TEXT NOT NULL DEFAULT 'default',
  mood              TEXT NOT NULL DEFAULT 'neutral',
  xp                INTEGER NOT NULL DEFAULT 0,
  unlockedSkins     TEXT NOT NULL DEFAULT '["default"]',
  lastInteractionAt TEXT
);

CREATE TABLE IF NOT EXISTS streaks (
  userId          TEXT PRIMARY KEY REFERENCES users(userId),
  currentStreak   INTEGER NOT NULL DEFAULT 0,
  longestStreak   INTEGER NOT NULL DEFAULT 0,
  lastCheckinAt   TEXT,
  totalDaysActive INTEGER NOT NULL DEFAULT 0,
  startedAt       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS streak_days (
  userId          TEXT NOT NULL REFERENCES users(userId),
  date            TEXT NOT NULL,
  active          INTEGER NOT NULL DEFAULT 0,
  levelsCompleted INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (userId, date)
);

CREATE TABLE IF NOT EXISTS calibration_results (
  userId                TEXT PRIMARY KEY REFERENCES users(userId),
  completedAt           TEXT NOT NULL,
  learningPath          TEXT NOT NULL,
  topicScores           TEXT NOT NULL,
  recommendedStartLevel INTEGER NOT NULL,
  durationMs            INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS metric_events (
  id        TEXT PRIMARY KEY,
  eventType TEXT NOT NULL,
  userId    TEXT REFERENCES users(userId),
  timestamp TEXT NOT NULL,
  payload   TEXT
);
CREATE INDEX IF NOT EXISTS idx_metric_user_ts ON metric_events(userId, timestamp);
