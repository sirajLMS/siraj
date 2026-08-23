-- Source: 7d-appearance-permissions-data.sql
-- Migration: Appearance (site branding) permissions — data (Phase 1)
-- Inserts the `settings.appearance_manage` permission row + grants it to the
-- `super_admin` and `academy_admin` groups.
--
-- DEPENDENCY: `7c-appearance-permissions-enum.sql` MUST be applied first
-- (separate drizzle migration folder / transaction) because
-- `permissions.key` is typed `app_permission` (PG enum), NOT plain text.
-- PostgreSQL `check_safe_enum_use` forbids using a freshly-added enum value
-- in the same transaction that added it. The auto-bundler sorts files
-- alphabetically, so `7c-...-enum` (alphabetically earlier) is applied before
-- `7d-...-data`.
--
-- Key: settings.appearance_manage
-- Resource: settings  (shares the `settings` resource with other settings.*
--                      permissions so it sorts with them in the permissions
--                      catalog and reuses the existing `Settings` category.)
-- Action: appearance_manage
-- Category: {"ar": "الإعدادات", "en": "Settings"}  (matches 7b siblings)
-- is_system: true  (only seedable via migration; cannot be deleted from the UI)
--
-- Idempotent: ON CONFLICT (key) DO UPDATE refreshes resource/action/description/
-- category/is_system on every run. The trigger toggle is wrapped in DO $$ ...
-- EXCEPTION so re-runs do not fail if the trigger is already in the desired state.
--
-- AC-4: this permission SHALL be granted to BOTH `super_admin` and `academy_admin`.

-- Temporarily disable the system-permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'settings.appearance_manage',
    'settings',
    'appearance_manage',
    '{"ar": "إدارة مظهر الموقع والهوية البصرية", "en": "Manage site appearance and branding"}'::jsonb,
    '{"ar": "الإعدادات", "en": "Settings"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
-- Grant settings.appearance_manage to super_admin AND academy_admin (AC-4).
-- `academy_admin` is the SystemPermissionGroupSlug.ACADEMY_ADMIN slug — an academy
-- owner needs to brand their own instance. `ON CONFLICT DO NOTHING` makes this
-- safe to re-run.
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug IN ('super_admin', 'academy_admin')
  AND p.key = 'settings.appearance_manage'
ON CONFLICT DO NOTHING;--> statement-breakpoint

