-- Migration: Add quotas.view and quotas.manage to app_permission pgEnum
-- `ADD VALUE IF NOT EXISTS` is natively idempotent; no EXCEPTION block is needed.
-- (A DO $$ ... EXCEPTION block would require valid PL/pgSQL condition names —
--  duplicate_value / object_not_string are not, and the IF NOT EXISTS guard
--  makes swallow-on-duplicate unnecessary.)
ALTER TYPE "app_permission" ADD VALUE IF NOT EXISTS 'quotas.view';
ALTER TYPE "app_permission" ADD VALUE IF NOT EXISTS 'quotas.manage';
