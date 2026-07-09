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
  (gen_random_uuid(), 'subjects.list'::app_permission, 'subjects', 'list', '{"ar": "List class subjects", "en": "List class subjects"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'subjects.create'::app_permission, 'subjects', 'create', '{"ar": "Create class subjects", "en": "Create class subjects"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'subjects.update'::app_permission, 'subjects', 'update', '{"ar": "Update class subjects", "en": "Update class subjects"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'subjects.delete'::app_permission, 'subjects', 'delete', '{"ar": "Delete class subjects", "en": "Delete class subjects"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'categories.list'::app_permission, 'categories', 'list', '{"ar": "List class categories", "en": "List class categories"}'::jsonb, '{"ar": "Categories", "en": "Categories"}'::jsonb, true),
  (gen_random_uuid(), 'categories.create'::app_permission, 'categories', 'create', '{"ar": "Create class categories", "en": "Create class categories"}'::jsonb, '{"ar": "Categories", "en": "Categories"}'::jsonb, true),
  (gen_random_uuid(), 'categories.update'::app_permission, 'categories', 'update', '{"ar": "Update class categories", "en": "Update class categories"}'::jsonb, '{"ar": "Categories", "en": "Categories"}'::jsonb, true),
  (gen_random_uuid(), 'categories.delete'::app_permission, 'categories', 'delete', '{"ar": "Delete class categories", "en": "Delete class categories"}'::jsonb, '{"ar": "Categories", "en": "Categories"}'::jsonb, true),
  (gen_random_uuid(), 'subjects.view_resources'::app_permission, 'subjects', 'view_resources', '{"ar": "View subject resources", "en": "View subject resources"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'subjects.manage_resources'::app_permission, 'subjects', 'manage_resources', '{"ar": "Attach and detach subject resources", "en": "Attach and detach subject resources"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'notes.list'::app_permission, 'notes', 'list', '{"ar": "List teacher important notes", "en": "List teacher important notes"}'::jsonb, '{"ar": "Notes", "en": "Notes"}'::jsonb, true),
  (gen_random_uuid(), 'notes.create'::app_permission, 'notes', 'create', '{"ar": "Create teacher important notes", "en": "Create teacher important notes"}'::jsonb, '{"ar": "Notes", "en": "Notes"}'::jsonb, true),
  (gen_random_uuid(), 'notes.update'::app_permission, 'notes', 'update', '{"ar": "Update teacher important notes", "en": "Update teacher important notes"}'::jsonb, '{"ar": "Notes", "en": "Notes"}'::jsonb, true),
  (gen_random_uuid(), 'notes.delete'::app_permission, 'notes', 'delete', '{"ar": "Delete teacher important notes", "en": "Delete teacher important notes"}'::jsonb, '{"ar": "Notes", "en": "Notes"}'::jsonb, true)
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;

-- Re-enable the trigger (guaranteed even if INSERT fails above)
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;

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
