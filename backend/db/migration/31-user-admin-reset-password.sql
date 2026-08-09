-- Migration: Add USER_ADMIN_RESET_PASSWORD permission for super admin — enum addition (Phase 1)
-- Allows super admins to reset passwords of other users via admin panel
-- PostgreSQL `check_safe_enum_use` forbids using a freshly-added enum value inside
-- the same transaction that added it, so the enum addition MUST be applied and
-- committed separately from any INSERTs that reference the new enum value.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'user.admin_reset_password';