-- Migration: Settings page permissions — enum additions (Phase 1)
-- Introduces the 7 `app_permission` enum values gating the new /settings route tabs.
-- Split from the original 7-settings-permissions.sql so the `ALTER TYPE` is committed
-- in its own drizzle migration transaction before Phase 2 (7b) uses these enum values.
-- PostgreSQL `check_safe_enum_use` forbids using a freshly-added enum value inside
-- the same transaction that added it, so the enum additions MUST be applied and
-- committed separately from any INSERTs that reference the new enum values.
--
-- Values:
--   settings.view, settings.edit_general, settings.edit_env, settings.edit_session,
--   settings.audit_view, settings.site_content_manage, settings.timezones_view.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.edit_general';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.edit_env';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.edit_session';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.audit_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.site_content_manage';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.timezones_view';
