-- Source: 8a-system-setting-enums.sql
-- Migration 8a: System setting enums — convert `system_settings.data_type` and
-- `system_settings.category` from varchar to Postgres enums. Fully idempotent:
-- safe to redeploy across environments that are already migrated or partially
-- migrated. Relies on the project's standard DO $$ EXCEPTION WHEN duplicate_object
-- / feature_not_supported idioms plus an information_schema guard so the
-- ALTER COLUMN TYPE blocks are no-ops when the column is already the enum type.
-- No custom fix scripts.
--
-- We CREATE TYPE two new enums (no `ALTER TYPE ADD VALUE` on existing types),
-- so `check_safe_enum_use` does NOT apply and the entire migration is safe
-- inside a single transaction. The `lower(category)` normalization (fixing the
-- 'Scheduling' row from migration 4b-teacher_support_contact_setting.sql)
-- folds into the `USING` clause of the category conversion — no separate backfill.

-- Create the new enum types idempotently.
DO $$ BEGIN
  CREATE TYPE system_setting_data_type AS ENUM ('string', 'integer', 'boolean', 'json');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE system_setting_category AS ENUM
    ('security','system','scheduling','communication','email','sms','push',
     'fx','cache','redis','storage','auth','app','meeting','billing','general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
-- Convert data_type varchar -> enum, but only when the column is still varchar.
-- On an already-converted column this DO block is a pure no-op (no exception path
-- needed — the body simply doesn't execute the ALTER). The EXCEPTION clause is
-- kept as a defense-in-depth fallback for concurrent migrations.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings'
      AND column_name = 'data_type'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE system_settings ALTER COLUMN data_type DROP DEFAULT;
    ALTER TABLE system_settings
      ALTER COLUMN data_type TYPE system_setting_data_type
      USING data_type::system_setting_data_type;
    ALTER TABLE system_settings ALTER COLUMN data_type SET DEFAULT 'string'::system_setting_data_type;
  END IF;
EXCEPTION
  WHEN feature_not_supported THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
-- Convert category varchar -> enum, normalizing case via lower() (fixes the
-- 'Scheduling' row). Gated on the column still being varchar so re-runs on an
-- already-converted enum column are a pure no-op — the lower(enum) call would
-- otherwise raise undefined_function (42883) since enums don't implicitly cast
-- to text. The EXCEPTION clause also catches undefined_function as a fallback.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings'
      AND column_name = 'category'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE system_settings ALTER COLUMN category DROP DEFAULT;
    ALTER TABLE system_settings
      ALTER COLUMN category TYPE system_setting_category
      USING lower(category)::system_setting_category;
  END IF;
EXCEPTION
  WHEN feature_not_supported THEN NULL;
  WHEN duplicate_object THEN NULL;
  WHEN undefined_function THEN NULL;
END $$;--> statement-breakpoint
-- Set the default (idempotent: assigning the same default is a no-op).
ALTER TABLE system_settings
  ALTER COLUMN data_type SET DEFAULT 'string'::system_setting_data_type;--> statement-breakpoint

