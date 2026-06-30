-- Source: 4-class_categories_and_subjects.sql
-- Migration 4: Class Categories, Subjects, Subject Resources, Teacher Important Notes
-- Creates 4 new tables, adds subject_id FK to recurring_schedules and class_instances,
-- adds 13 new permissions to app_permission enum.

-- ============================================================
-- 1. CREATE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS class_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz(3) NOT NULL DEFAULT NOW(),
  updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
  deleted_at timestamptz(3)
);

CREATE INDEX IF NOT EXISTS class_categories_slug_idx ON class_categories (slug);

CREATE TABLE IF NOT EXISTS class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES class_categories(id) ON DELETE RESTRICT,
  name varchar(200) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz(3) NOT NULL DEFAULT NOW(),
  updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
  deleted_at timestamptz(3)
);

CREATE INDEX IF NOT EXISTS class_subjects_category_id_idx ON class_subjects (category_id);
CREATE UNIQUE INDEX IF NOT EXISTS class_subjects_slug_idx ON class_subjects (slug);

CREATE TABLE IF NOT EXISTS subject_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES class_subjects(id) ON DELETE CASCADE,
  learning_resource_id uuid NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  resource_type varchar(50),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz(3) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS subject_resources_subject_id_learning_resource_id_idx ON subject_resources (subject_id, learning_resource_id);

CREATE TABLE IF NOT EXISTS teacher_important_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE RESTRICT,
  title varchar(300) NOT NULL,
  body text,
  is_published boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  starts_at timestamptz(3),
  expires_at timestamptz(3),
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz(3) NOT NULL DEFAULT NOW(),
  updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
  deleted_at timestamptz(3)
);

CREATE INDEX IF NOT EXISTS teacher_important_notes_teacher_id_idx ON teacher_important_notes (teacher_id);

-- ============================================================
-- 2. ALTER TABLE — Add subject_id FK to scheduling tables
-- ============================================================

ALTER TABLE recurring_schedules
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES class_subjects(id) ON DELETE RESTRICT;

-- ============================================================
-- DEPLOY SAFETY: These CREATE INDEX statements will lock recurring_schedules
-- and class_instances for writes during index build. For production deployments
-- with existing data, run these indexes manually BEFORE applying this migration:
--   CREATE INDEX CONCURRENTLY recurring_schedules_subject_id_idx ON recurring_schedules (subject_id);
--   CREATE INDEX CONCURRENTLY class_instances_subject_id_idx ON class_instances (subject_id);
-- Then change the statements below to IF NOT EXISTS (they will be no-ops since indexes already exist).
-- ============================================================
CREATE INDEX IF NOT EXISTS recurring_schedules_subject_id_idx ON recurring_schedules (subject_id);

ALTER TABLE class_instances
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES class_subjects(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS class_instances_subject_id_idx ON class_instances (subject_id);

-- ============================================================
-- 3. ALTER TYPE — Add 13 new permission values to app_permission enum
-- ============================================================

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.list';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.update';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.list';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.update';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.view_resources';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.manage_resources';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.list';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.update';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.delete';

-- Source: 4a-class_categories_and_subjects_seed.sql
-- Migration 4-seed: Seed data for class categories, subjects, permissions, and settings
-- MUST run AFTER 4-class_categories_and_subjects.sql in a separate transaction.
-- The app_permission enum values must be committed before this runs.

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
-- Uses DO block to ensure trigger is re-enabled even if INSERT fails
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;

-- ============================================================
-- 1. INSERT INTO permissions — 13 new permission keys
-- ============================================================

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (gen_random_uuid(), 'subjects.list', 'subjects', 'list', 'List class subjects', 'Subjects', true),
  (gen_random_uuid(), 'subjects.create', 'subjects', 'create', 'Create class subjects', 'Subjects', true),
  (gen_random_uuid(), 'subjects.update', 'subjects', 'update', 'Update class subjects', 'Subjects', true),
  (gen_random_uuid(), 'subjects.delete', 'subjects', 'delete', 'Delete class subjects', 'Subjects', true),
  (gen_random_uuid(), 'categories.list', 'categories', 'list', 'List class categories', 'Categories', true),
  (gen_random_uuid(), 'categories.create', 'categories', 'create', 'Create class categories', 'Categories', true),
  (gen_random_uuid(), 'categories.update', 'categories', 'update', 'Update class categories', 'Categories', true),
  (gen_random_uuid(), 'categories.delete', 'categories', 'delete', 'Delete class categories', 'Categories', true),
  (gen_random_uuid(), 'subjects.view_resources', 'subjects', 'view_resources', 'View subject resources', 'Subjects', true),
  (gen_random_uuid(), 'subjects.manage_resources', 'subjects', 'manage_resources', 'Attach and detach subject resources', 'Subjects', true),
  (gen_random_uuid(), 'notes.list', 'notes', 'list', 'List teacher important notes', 'Notes', true),
  (gen_random_uuid(), 'notes.create', 'notes', 'create', 'Create teacher important notes', 'Notes', true),
  (gen_random_uuid(), 'notes.update', 'notes', 'update', 'Update teacher important notes', 'Notes', true),
  (gen_random_uuid(), 'notes.delete', 'notes', 'delete', 'Delete teacher important notes', 'Notes', true)
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;

-- Re-enable the trigger
ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;

-- ============================================================
-- 2. INSERT INTO group_permissions — assign to super_admin + academy_admin
-- ============================================================

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE g.slug = 'super_admin'
  AND p.key IN (
    'subjects.list',
    'subjects.create',
    'subjects.update',
    'subjects.delete',
    'categories.list',
    'categories.create',
    'categories.update',
    'categories.delete',
    'subjects.view_resources',
    'subjects.manage_resources',
    'notes.list',
    'notes.create',
    'notes.update',
    'notes.delete'
  )
ON CONFLICT DO NOTHING;

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE g.slug = 'academy_admin'
  AND p.key IN (
    'subjects.list',
    'subjects.create',
    'subjects.update',
    'subjects.delete',
    'categories.list',
    'categories.create',
    'categories.update',
    'categories.delete',
    'subjects.view_resources',
    'subjects.manage_resources',
    'notes.list',
    'notes.create',
    'notes.update',
    'notes.delete'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. INSERT default categories and subjects
-- ============================================================

INSERT INTO class_categories (name, slug, description, is_active, sort_order)
VALUES
  ('Quran', 'quran', 'Quran recitation and memorization studies', true, 1),
  ('Arabic Language', 'arabic-language', 'Arabic language and grammar studies', true, 2),
  ('Islamic Studies', 'islamic-studies', 'Islamic studies including fiqh, aqidah, and seerah', true, 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Quran Recitation', 'quran-recitation', 'Quran recitation practice and tajweed', true, 1
FROM class_categories cat WHERE cat.slug = 'quran'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Quran Memorization', 'quran-memorization', 'Hifz — Quran memorization and review', true, 2
FROM class_categories cat WHERE cat.slug = 'quran'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Arabic Grammar', 'arabic-grammar', 'Nahw and Sarf — Arabic grammar foundations', true, 1
FROM class_categories cat WHERE cat.slug = 'arabic-language'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Arabic Conversation', 'arabic-conversation', 'Arabic speaking and conversation practice', true, 2
FROM class_categories cat WHERE cat.slug = 'arabic-language'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Fiqh', 'fiqh', 'Islamic jurisprudence and rulings', true, 1
FROM class_categories cat WHERE cat.slug = 'islamic-studies'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Aqidah', 'aqidah', 'Islamic creed and theology', true, 2
FROM class_categories cat WHERE cat.slug = 'islamic-studies'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Seerah', 'seerah', 'Prophetic biography and life of the Prophet', true, 3
FROM class_categories cat WHERE cat.slug = 'islamic-studies'
ON CONFLICT (slug) DO NOTHING;

-- Source: 4b-teacher_support_contact_setting.sql
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
