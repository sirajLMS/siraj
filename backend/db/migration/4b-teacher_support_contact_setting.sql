-- Migration 4b: Teacher Support Contact System Setting
-- Inserts the teacher_support_contact_staff_profile_id setting into system_settings.

INSERT INTO system_settings (key, value, data_type, description, category, updated_at)
VALUES (
  'teacher_support_contact_staff_profile_id',
  '',
  'string',
  'Staff profile ID of the teacher support coordinator displayed on the teacher schedule page',
  'Scheduling',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();
