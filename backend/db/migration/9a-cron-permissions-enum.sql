-- Migration: Cron service permissions — enum addition (Phase 1)
-- Introduces the `cron.manage` enum value gating the cron admin dashboard.
-- Split from 9b-cron-permissions-data.sql so the `ALTER TYPE` is committed
-- in its own drizzle migration transaction before Phase 2 (9b) uses the enum value.
-- PostgreSQL `check_safe_enum_use` forbids using a freshly-added enum value inside
-- the same transaction that added it, so the enum addition MUST be applied and
-- committed separately from any INSERTs that reference the new enum value.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'cron.manage';
