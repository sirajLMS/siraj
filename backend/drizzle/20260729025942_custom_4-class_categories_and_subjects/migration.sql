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
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS class_categories_slug_idx ON class_categories (slug);--> statement-breakpoint
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
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS class_subjects_category_id_idx ON class_subjects (category_id);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS class_subjects_slug_idx ON class_subjects (slug);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS subject_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES class_subjects(id) ON DELETE CASCADE,
  learning_resource_id uuid NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  resource_type varchar(50),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz(3) NOT NULL DEFAULT NOW()
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS subject_resources_subject_id_learning_resource_id_idx ON subject_resources (subject_id, learning_resource_id);--> statement-breakpoint
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
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS teacher_important_notes_teacher_id_idx ON teacher_important_notes (teacher_id);--> statement-breakpoint
-- ============================================================
-- 2. ALTER TABLE — Add subject_id FK to scheduling tables
-- ============================================================

ALTER TABLE recurring_schedules
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES class_subjects(id) ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE class_instances
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES class_subjects(id) ON DELETE RESTRICT;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'subjects.list'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'subjects.list';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'subjects.create'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'subjects.create';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'subjects.update'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'subjects.update';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'subjects.delete'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'subjects.delete';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'categories.list'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'categories.list';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'categories.create'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'categories.create';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'categories.update'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'categories.update';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'categories.delete'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'categories.delete';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'subjects.view_resources'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'subjects.view_resources';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'subjects.manage_resources'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'subjects.manage_resources';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'notes.list'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'notes.list';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'notes.create'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'notes.create';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'notes.update'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'notes.update';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'notes.delete'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'notes.delete';
    END IF;
END $$;--> statement-breakpoint

