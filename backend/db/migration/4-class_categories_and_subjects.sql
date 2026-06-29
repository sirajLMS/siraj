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

CREATE INDEX CONCURRENTLY IF NOT EXISTS recurring_schedules_subject_id_idx ON recurring_schedules (subject_id);

ALTER TABLE class_instances
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES class_subjects(id) ON DELETE RESTRICT;

CREATE INDEX CONCURRENTLY IF NOT EXISTS class_instances_subject_id_idx ON class_instances (subject_id);

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
