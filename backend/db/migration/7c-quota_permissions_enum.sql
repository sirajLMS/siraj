-- Migration: Add quotas.view and quotas.manage to app_permission pgEnum
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'quotas.view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'quotas.manage';
