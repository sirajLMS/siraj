-- Source: 7c-quota_permissions_enum.sql
-- Migration: Add quotas.view and quotas.manage to app_permission pgEnum
-- `ADD VALUE IF NOT EXISTS` is natively idempotent; no EXCEPTION block is needed.
-- (The prior DO $$ ... EXCEPTION WHEN duplicate_value/object_not_string block was broken:
--  those are not valid PL/pgSQL condition names, raising 42704 on compilation.)
ALTER TYPE "app_permission" ADD VALUE IF NOT EXISTS 'quotas.view';--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'quotas.manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'quotas.manage';
    END IF;
END $$;--> statement-breakpoint

