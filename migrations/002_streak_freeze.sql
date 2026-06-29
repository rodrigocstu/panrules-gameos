-- EGC-12 — Streak-Freeze: tokens de congelación + marca de día cubierto por Freeze.
--
-- Migración ADITIVA con DEFAULT 0: no rompe filas existentes (architecture §3, camelCase 1:1
-- con el dominio). NO editar 001_initial_schema.sql (ya aplicada). Aplicar con (paso DOps, no
-- ejecutable en este entorno Windows/OneDrive sin wrangler):
--   wrangler d1 migrations apply edugame-db --remote

ALTER TABLE streaks ADD COLUMN freezeTokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE streak_days ADD COLUMN isFreeze INTEGER NOT NULL DEFAULT 0;
