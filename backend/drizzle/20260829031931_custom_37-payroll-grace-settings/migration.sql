-- Source: 37-payroll-grace-settings.sql
-- Migration: Payroll grace-period system settings seed
-- Seeds the three grace-threshold settings consumed by teacher payroll
-- calculation. Idempotent via ON CONFLICT (key) DO NOTHING — re-running never
-- overwrites values an administrator has tuned.
-- data_type/category values follow SystemSettingDataType/SystemSettingCategory
-- (lowercase literals, matching shared/constants/settings/system-settings.enum.ts).

INSERT INTO system_settings (key, value, data_type, description, category, updated_at)
VALUES
  (
    'payroll.grace_short_minutes',
    '3',
    'integer',
    '{"ar": "فترة السماح (بالدقائق) للحصص التي لا تتجاوز حد الفصل بين فترتي السماح", "en": "Grace period (minutes) for sessions at or below payroll.grace_threshold_minutes"}'::jsonb,
    'payroll',
    NOW()
  ),
  (
    'payroll.grace_long_minutes',
    '6',
    'integer',
    '{"ar": "فترة السماح (بالدقائق) للحصص التي تتجاوز حد الفصل بين فترتي السماح", "en": "Grace period (minutes) for sessions above payroll.grace_threshold_minutes"}'::jsonb,
    'payroll',
    NOW()
  ),
  (
    'payroll.grace_threshold_minutes',
    '30',
    'integer',
    '{"ar": "حد الفصل (بالدقائق) لمدة الحصة المجدولة الذي يحدد فترة السماح المطبقة", "en": "Scheduled-duration cutoff (minutes) that picks the short vs long grace period"}'::jsonb,
    'payroll',
    NOW()
  )
ON CONFLICT (key) DO NOTHING;--> statement-breakpoint

