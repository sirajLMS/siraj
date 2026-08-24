-- Monthly Appraisal permissions (R1 — Monthly Appraisals)
-- Adds 3 new AppPermission values + assigns them to permission groups.
-- Idempotent: safe to re-run.

-- Add the new enum values to the app_permission PG type first (required before
-- any INSERT/CAST can reference them). ALTER TYPE ADD VALUE cannot run inside
-- a transaction block, so these run as standalone statements.
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'appraisal.submit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'appraisal.view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'appraisal.feedback';

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
SELECT gen_random_uuid(), v.key::app_permission, v.resource, v.action, v.description::jsonb, v.category::jsonb, true
FROM (VALUES
    (
      'appraisal.submit',
      'appraisal',
      'submit',
      '{"ar": "تقديم/تحديث التقييم الشهري للطالب", "en": "Submit/update a student monthly appraisal"}',
      '{"ar": "التقييمات", "en": "Appraisals"}'
    ),
    (
      'appraisal.view',
      'appraisal',
      'view',
      '{"ar": "عرض التقييمات الشهرية", "en": "View monthly appraisals"}',
      '{"ar": "التقييمات", "en": "Appraisals"}'
    ),
    (
      'appraisal.feedback',
      'appraisal',
      'feedback',
      '{"ar": "إضافة ملاحظات على التقييم الشهري", "en": "Append feedback to a monthly appraisal"}',
      '{"ar": "التقييمات", "en": "Appraisals"}'
    )
) AS v(key, resource, action, description, category)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.key = v.key::app_permission);

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;

-- super_admin: all 3 appraisal permissions
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('appraisal.submit', 'appraisal.view', 'appraisal.feedback')
WHERE g.slug = 'super_admin'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id);

-- academy_admin: all 3 appraisal permissions
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('appraisal.submit', 'appraisal.view', 'appraisal.feedback')
WHERE g.slug = 'academy_admin'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id);

-- teacher_default: submit + view
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('appraisal.submit', 'appraisal.view')
WHERE g.slug = 'teacher_default'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id);

-- supervisor_default: submit + view
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('appraisal.submit', 'appraisal.view')
WHERE g.slug = 'supervisor_default'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id);

-- student_default: view + feedback
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('appraisal.view', 'appraisal.feedback')
WHERE g.slug = 'student_default'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id);

-- parent_default: view + feedback
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN ('appraisal.view', 'appraisal.feedback')
WHERE g.slug = 'parent_default'
  AND NOT EXISTS (SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id);
