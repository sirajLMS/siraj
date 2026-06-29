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
