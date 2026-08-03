-- Migration: Add quotas.view and quotas.manage to app_permission pgEnum
-- Wrapped in DO block with exception handling for safe re-runnability.
DO $$ BEGIN
  ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'quotas.view';
EXCEPTION
  WHEN duplicate_value THEN NULL;
  WHEN object_not_string THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'quotas.manage';
EXCEPTION
  WHEN duplicate_value THEN NULL;
  WHEN object_not_string THEN NULL;
END $$;
