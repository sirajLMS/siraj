-- Source: 34-credit-hours-system-settings-seed.sql
-- Migration: Credit-hours system settings seed (Phase 1)
-- Seeds the three accounting system settings used by the module.
-- Idempotent via ON CONFLICT upsert.
-- data_type/category values follow SystemSettingDataType/SystemSettingCategory
-- (lowercase literals, matching shared/constants/settings/system-settings.enum.ts).

INSERT INTO system_settings (key, value, data_type, description, category, updated_at)
VALUES
  (
    'accounting_default_currency',
    'EGP',
    'string',
    '{"ar": "العملة الافتراضية لنموذج إضافة دفعة المحاسبة", "en": "Default currency for the Add Payment form"}'::jsonb,
    'billing',
    NOW()
  ),
  (
    'accounting_low_hours_threshold',
    '2.00',
    'string',
    '{"ar": "حد التنبيه عند انخفاض رصيد الساعات", "en": "Low-balance alert threshold in hours"}'::jsonb,
    'billing',
    NOW()
  ),
  (
    'accounting_paid_toggle_auto_flips_invoice',
    'true',
    'boolean',
    '{"ar": "عند تفعيلها، يقوم زر الحالة المدفوعة بتحديث حالة الفاتورة تلقائياً", "en": "When true, toggling Paid flips the invoice status automatically"}'::jsonb,
    'billing',
    NOW()
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  data_type = EXCLUDED.data_type,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = EXCLUDED.updated_at;--> statement-breakpoint

