-- Migration: WhatsApp permissions — enum additions (Phase 1)
-- Introduces the 3 `app_permission` enum values gating WhatsApp admin features.
-- Split into 8a (enum) and 8b (data) so the `ALTER TYPE` is committed
-- in its own drizzle migration transaction before Phase 2 (8b) uses these enum values.
-- PostgreSQL `check_safe_enum_use` forbids using a freshly-added enum value inside
-- the same transaction that added it, so the enum additions MUST be applied and
-- committed separately from any INSERTs that reference the new enum values.
--
-- Values:
--   whatsapp.view, whatsapp.config_manage, whatsapp.templates_manage
-- Note: whatsapp.dispatch intentionally omitted — no send-mutation exists in v1 (BL2).

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'whatsapp.view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'whatsapp.config_manage';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'whatsapp.templates_manage';
