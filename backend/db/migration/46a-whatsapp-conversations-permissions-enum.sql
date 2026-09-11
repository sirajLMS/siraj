-- Migration: WhatsApp conversations permissions — enum additions (Phase 1)
-- Introduces the 2 `app_permission` enum values gating the WhatsApp Conversations
-- workspace (`/whatsapp`: conversation list/read + send composer).
-- Split into 46a (enum) and 46b (data) so the `ALTER TYPE` is committed
-- in its own drizzle migration transaction before Phase 2 (46b) uses these enum values.
-- PostgreSQL `check_safe_enum_use` forbids using a freshly-added enum value inside
-- the same transaction that added it, so the enum additions MUST be applied and
-- committed separately from any INSERTs that reference the new enum values.
--
-- Values:
--   whatsapp.conversations_view, whatsapp.conversations_manage
-- Idempotent: safe to re-run.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'whatsapp.conversations_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'whatsapp.conversations_manage';
