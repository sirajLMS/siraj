-- Migration 4c: Seed data for system settings
-- Populates initial system configuration into production database.

INSERT INTO system_settings (key, value, data_type, description, category, updated_at)
VALUES
  ('auth_max_attempts', '5', 'integer', 'Maximum failed login attempts before lockout', 'security', NOW()),
  ('auth_lockout_minutes', '15', 'integer', 'Duration of account lockout in minutes', 'security', NOW()),
  ('password_reset_expiry_hours', '24', 'integer', 'Expiration time for password reset tokens in hours', 'security', NOW()),
  ('cache_default_ttl_seconds', '3600', 'integer', 'Default TTL for cache entries in seconds', 'system', NOW()),
  ('session_activation_window_before_minutes', '5', 'integer', 'Minutes before scheduled start time that a session can be activated', 'scheduling', NOW()),
  ('default_timezone', 'UTC', 'string', 'Default fallback timezone for the system', 'scheduling', NOW()),
  ('session_absent_waiting_minutes', '30', 'integer', 'Minutes to wait before student can be marked absent', 'scheduling', NOW()),
  ('session_missed_grace_minutes', '15', 'integer', 'Minutes after scheduled end time before an unactivated class is auto-marked as missed', 'scheduling', NOW()),
  ('session_leave_reschedule_offset_days', '7', 'integer', 'Days offset to reschedule when leave is processed', 'scheduling', NOW()),
  ('teacher_max_leaves', '2', 'integer', 'Maximum number of leave requests a teacher can make per calendar month', 'scheduling', NOW()),
  ('student_max_leaves', '2', 'integer', 'Maximum number of leave requests a student can make per calendar month', 'scheduling', NOW()),
  ('complaint_max_file_size_mb', '25', 'integer', 'Maximum file size for complaint attachments in MB', 'communication', NOW()),
  ('complaint_max_files_per_complaint', '5', 'integer', 'Maximum number of files per complaint', 'communication', NOW()),
  ('sms_rate_limit_per_hour', '3', 'integer', 'Maximum SMS messages per parent per hour', 'communication', NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  data_type = EXCLUDED.data_type,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();
