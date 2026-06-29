// D1Helper — acceso tipado a D1 (EGC-10). Prefijo `_` ⇒ no es ruta de Pages.
//
// Columnas en camelCase para coincidir VERBATIM con architecture.md §3 (mapeo 1:1 con los
// tipos del dominio EGC-6, sin capa de conversión snake_case). SIEMPRE consultas
// parametrizadas (`.bind`) — nunca interpolación de input de usuario (anti-SQLi).
import type { D1Database } from './_shared';

export interface UserRow {
  userId: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  lastSeenAt: string;
  learningPath: string;
  calibrationDone: number;
}

export interface StreakRow {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckinAt: string;
  totalDaysActive: number;
  startedAt: string;
  /** EGC-12: tokens de congelación (migración 002). */
  freezeTokens: number;
}

export interface StreakDayRow {
  userId: string;
  date: string;
  active: number;
  levelsCompleted: number;
  /** EGC-12: 1 si el día se cubrió con un Freeze (migración 002). */
  isFreeze: number;
}

export interface CalibrationResultRow {
  userId: string;
  completedAt: string;
  learningPath: string;
  topicScores: string;
  recommendedStartLevel: number;
  durationMs: number;
}

export interface AvatarRow {
  userId: string;
  skin: string;
  mood: string;
  xp: number;
  unlockedSkins: string;
  lastInteractionAt: string;
}

export class D1Helper {
  constructor(private readonly db: D1Database) {}

  // ─── users ───────────────────────────────────────────────────────────────────
  getUserByEmail(email: string): Promise<UserRow | null> {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  }

  getUserById(userId: string): Promise<UserRow | null> {
    return this.db.prepare('SELECT * FROM users WHERE userId = ?').bind(userId).first<UserRow>();
  }

  async createUser(row: UserRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO users (userId, email, passwordHash, displayName, createdAt, lastSeenAt, learningPath, calibrationDone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        row.userId,
        row.email,
        row.passwordHash,
        row.displayName,
        row.createdAt,
        row.lastSeenAt,
        row.learningPath,
        row.calibrationDone
      )
      .run();
  }

  async setLearningPath(userId: string, learningPath: string): Promise<void> {
    await this.db
      .prepare('UPDATE users SET learningPath = ?, calibrationDone = 1 WHERE userId = ?')
      .bind(learningPath, userId)
      .run();
  }

  async touchLastSeen(userId: string, iso: string): Promise<void> {
    await this.db.prepare('UPDATE users SET lastSeenAt = ? WHERE userId = ?').bind(iso, userId).run();
  }

  // ─── refresh_tokens ──────────────────────────────────────────────────────────
  async storeRefreshToken(userId: string, tokenHash: string, expiresAt: string): Promise<void> {
    await this.db
      .prepare('INSERT INTO refresh_tokens (tokenHash, userId, expiresAt) VALUES (?, ?, ?)')
      .bind(tokenHash, userId, expiresAt)
      .run();
  }

  getRefreshToken(tokenHash: string): Promise<{ userId: string; expiresAt: string } | null> {
    return this.db
      .prepare('SELECT userId, expiresAt FROM refresh_tokens WHERE tokenHash = ?')
      .bind(tokenHash)
      .first<{ userId: string; expiresAt: string }>();
  }

  async deleteRefreshTokensForUser(userId: string): Promise<void> {
    await this.db.prepare('DELETE FROM refresh_tokens WHERE userId = ?').bind(userId).run();
  }

  // ─── streaks ──────────────────────────────────────────────────────────────────
  getStreak(userId: string): Promise<StreakRow | null> {
    return this.db.prepare('SELECT * FROM streaks WHERE userId = ?').bind(userId).first<StreakRow>();
  }

  async createStreak(row: StreakRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO streaks (userId, currentStreak, longestStreak, lastCheckinAt, totalDaysActive, startedAt, freezeTokens)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        row.userId,
        row.currentStreak,
        row.longestStreak,
        row.lastCheckinAt,
        row.totalDaysActive,
        row.startedAt,
        row.freezeTokens
      )
      .run();
  }

  async updateStreak(row: StreakRow): Promise<void> {
    await this.db
      .prepare(
        `UPDATE streaks SET currentStreak = ?, longestStreak = ?, lastCheckinAt = ?, totalDaysActive = ?, freezeTokens = ?
         WHERE userId = ?`
      )
      .bind(
        row.currentStreak,
        row.longestStreak,
        row.lastCheckinAt,
        row.totalDaysActive,
        row.freezeTokens,
        row.userId
      )
      .run();
  }

  async upsertStreakDay(row: StreakDayRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO streak_days (userId, date, active, levelsCompleted, isFreeze) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(userId, date) DO UPDATE SET active = excluded.active, levelsCompleted = excluded.levelsCompleted, isFreeze = excluded.isFreeze`
      )
      .bind(row.userId, row.date, row.active, row.levelsCompleted, row.isFreeze)
      .run();
  }

  async getStreakHistory(userId: string, days: number): Promise<StreakDayRow[]> {
    const res = await this.db
      .prepare('SELECT * FROM streak_days WHERE userId = ? ORDER BY date DESC LIMIT ?')
      .bind(userId, days)
      .all<StreakDayRow>();
    return res.results ?? [];
  }

  /**
   * EGC-12: completaciones de nivel anotadas con su día-desde-registro (cohorte D3). JOIN
   * metric_events × users; dayOffset = días civiles enteros desde users.createdAt al evento.
   * Sin input de usuario interpolado (eventType es literal) → parametrizado/anti-SQLi.
   */
  async getCohortCompletions(): Promise<{ userId: string; dayOffset: number }[]> {
    const res = await this.db
      .prepare(
        `SELECT m.userId AS userId,
                CAST(julianday(date(m.timestamp)) - julianday(date(u.createdAt)) AS INTEGER) AS dayOffset
         FROM metric_events m
         JOIN users u ON u.userId = m.userId
         WHERE m.eventType = 'level_completed'`
      )
      .all<{ userId: string; dayOffset: number }>();
    return res.results ?? [];
  }

  // ─── calibration_results ──────────────────────────────────────────────────────
  getCalibrationResult(userId: string): Promise<CalibrationResultRow | null> {
    return this.db
      .prepare('SELECT * FROM calibration_results WHERE userId = ?')
      .bind(userId)
      .first<CalibrationResultRow>();
  }

  async upsertCalibrationResult(row: CalibrationResultRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO calibration_results (userId, completedAt, learningPath, topicScores, recommendedStartLevel, durationMs)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(userId) DO UPDATE SET completedAt = excluded.completedAt, learningPath = excluded.learningPath,
           topicScores = excluded.topicScores, recommendedStartLevel = excluded.recommendedStartLevel, durationMs = excluded.durationMs`
      )
      .bind(
        row.userId,
        row.completedAt,
        row.learningPath,
        row.topicScores,
        row.recommendedStartLevel,
        row.durationMs
      )
      .run();
  }

  // ─── metric_events ────────────────────────────────────────────────────────────
  async createMetricEvent(
    id: string,
    eventType: string,
    userId: string,
    timestamp: string,
    payload: string
  ): Promise<void> {
    await this.db
      .prepare('INSERT INTO metric_events (id, eventType, userId, timestamp, payload) VALUES (?, ?, ?, ?, ?)')
      .bind(id, eventType, userId, timestamp, payload)
      .run();
  }

  async countActiveSince(userId: string, sinceIso: string): Promise<number> {
    const row = await this.db
      .prepare('SELECT COUNT(*) AS n FROM metric_events WHERE userId = ? AND timestamp >= ?')
      .bind(userId, sinceIso)
      .first<{ n: number }>();
    return row?.n ?? 0;
  }

  // ─── avatars ──────────────────────────────────────────────────────────────────
  getAvatar(userId: string): Promise<AvatarRow | null> {
    return this.db.prepare('SELECT * FROM avatars WHERE userId = ?').bind(userId).first<AvatarRow>();
  }

  async createAvatar(row: AvatarRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO avatars (userId, skin, mood, xp, unlockedSkins, lastInteractionAt) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(row.userId, row.skin, row.mood, row.xp, row.unlockedSkins, row.lastInteractionAt)
      .run();
  }

  async updateAvatar(userId: string, skin: string, mood: string, iso: string): Promise<void> {
    await this.db
      .prepare('UPDATE avatars SET skin = ?, mood = ?, lastInteractionAt = ? WHERE userId = ?')
      .bind(skin, mood, iso, userId)
      .run();
  }
}
