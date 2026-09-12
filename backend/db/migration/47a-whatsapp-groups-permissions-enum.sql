-- Migration: WhatsApp groups permissions — enum additions (Phase 1)
-- Introduces the 2 `app_permission` enum values gating the WhatsApp Groups
-- workspace (`/whatsapp`: group list/membership + creation/invite links/join requests).
-- Split into 47a (enum) and 47b (data) so the `ALTER TYPE` is committed
-- in its own drizzle migration transaction before Phase 2 (47b) uses these enum values.
-- PostgreSQL `check_safe_enum_use` forbids using a freshly-added enum value inside
-- the same transaction that added it, so the enum additions MUST be applied and
-- committed separately from any INSERTs that reference the new enum values.
--
-- Values:
--   whatsapp.groups_view, whatsapp.groups_manage
-- Idempotent: safe to re-run.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'whatsapp.groups_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'whatsapp.groups_manage';
