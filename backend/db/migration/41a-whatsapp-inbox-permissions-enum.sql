-- Migration: WhatsApp inbox permissions — enum additions (Phase 1)
-- Introduces the 2 `app_permission` enum values gating WhatsApp inbox features.
-- Split into 41a (enum) and 41b (data) so the `ALTER TYPE` is committed
-- in its own drizzle migration transaction before Phase 2 (41b) uses these enum values.
-- PostgreSQL `check_safe_enum_use` forbids using a freshly-added enum value inside
-- the same transaction that added it, so the enum additions MUST be applied and
-- committed separately from any INSERTs that reference the new enum values.
--
-- Values:
--   whatsapp.inbox_view, whatsapp.inbox_manage
-- Idempotent: safe to re-run.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'whatsapp.inbox_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'whatsapp.inbox_manage';
