DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'session.self_delay'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'session.self_delay';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'session.self_cancel'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'session.self_cancel';
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
INSERT INTO permissions (id, key, resource, action, description, category, is_system)
SELECT gen_random_uuid(), v.key::app_permission, v.resource, v.action, v.description::jsonb, v.category::jsonb, true
FROM (VALUES
    (
      'session.self_delay',
      'session',
      'self_delay',
      '{"ar": "طلب تأجيل جلسة ذاتي", "en": "Request a self-service session delay"}',
      '{"ar": "الجدولة", "en": "Scheduling"}'
    ),
    (
      'session.self_cancel',
      'session',
      'self_cancel',
      '{"ar": "طلب إلغاء جلسة ذاتي", "en": "Request a self-service session cancellation"}',
      '{"ar": "الجدولة", "en": "Scheduling"}'
    )
) AS v(key, resource, action, description, category)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.key = v.key::app_permission);--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
-- super_admin: both permissions
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('session.self_delay', 'session.self_cancel')
WHERE g.slug = 'super_admin'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id) ON CONFLICT DO NOTHING;--> statement-breakpoint
-- academy_admin: both permissions
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('session.self_delay', 'session.self_cancel')
WHERE g.slug = 'academy_admin'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id) ON CONFLICT DO NOTHING;--> statement-breakpoint
-- student_default: both permissions
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('session.self_delay', 'session.self_cancel')
WHERE g.slug = 'student_default'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id) ON CONFLICT DO NOTHING;--> statement-breakpoint
-- parent_default: both permissions
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('session.self_delay', 'session.self_cancel')
WHERE g.slug = 'parent_default'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id) ON CONFLICT DO NOTHING;--> statement-breakpoint
-- supervisor_default: both permissions (for approve/reject)
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('session.self_delay', 'session.self_cancel')
WHERE g.slug = 'supervisor_default'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id) ON CONFLICT DO NOTHING;--> statement-breakpoint

