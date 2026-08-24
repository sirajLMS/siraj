-- Source: appraisal_permissions.sql
-- Monthly Appraisal permissions (F1 — R1.1, R1.4, R1.5)
-- Idempotent: adds 3 permissions + group_permissions rows.

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
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
      'appraisal.submit',
      'appraisal',
      'submit',
      '{"ar": "تقديم/تحديث تقييم شهري لطالب", "en": "Submit or update a student monthly appraisal"}',
      '{"ar": "التقييمات الشهرية", "en": "Monthly Appraisals"}'
    ),
    (
      'appraisal.view',
      'appraisal',
      'view',
      '{"ar": "عرض التقييمات الشهرية", "en": "View monthly appraisals"}',
      '{"ar": "التقييمات الشهرية", "en": "Monthly Appraisals"}'
    ),
    (
      'appraisal.feedback',
      'appraisal',
      'feedback',
      '{"ar": "إضافة ملاحظات على التقييم الشهري", "en": "Append feedback to a monthly appraisal"}',
      '{"ar": "التقييمات الشهرية", "en": "Monthly Appraisals"}'
    )
) AS v(key, resource, action, description, category)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.key = v.key::app_permission);--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;--> statement-breakpoint
-- super_admin + academy_admin receive all 3 appraisal permissions
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'appraisal.submit',
    'appraisal.view',
    'appraisal.feedback'
)
WHERE g.slug = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'appraisal.submit',
    'appraisal.view',
    'appraisal.feedback'
)
WHERE g.slug = 'academy_admin'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint
-- teacher_default: SUBMIT + VIEW (author writes; can also view own students' appraisals)
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'appraisal.submit',
    'appraisal.view'
)
WHERE g.slug = 'teacher_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint
-- supervisor_default: SUBMIT + VIEW (supervisors may submit appraisals too)
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'appraisal.submit',
    'appraisal.view'
)
WHERE g.slug = 'supervisor_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint
-- student_default: VIEW + FEEDBACK (view own appraisals; append feedback)
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'appraisal.view',
    'appraisal.feedback'
)
WHERE g.slug = 'student_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint
-- parent_default: VIEW + FEEDBACK (view own children's appraisals; append feedback)
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'appraisal.view',
    'appraisal.feedback'
)
WHERE g.slug = 'parent_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  ) ON CONFLICT DO NOTHING;--> statement-breakpoint

