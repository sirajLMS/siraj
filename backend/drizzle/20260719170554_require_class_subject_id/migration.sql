-- Backfill NULL subject_id before enforcing NOT NULL.
-- Prefer an existing active subject (tajweed seed slug, else any active subject).
-- If none exist, insert a system "general" subject under the first available category.
DO $$
DECLARE
  fallback_subject_id uuid;
  fallback_category_id uuid;
BEGIN
  SELECT id INTO fallback_subject_id
  FROM class_subjects
  WHERE deleted_at IS NULL AND is_active = true AND slug = 'tajweed'
  LIMIT 1;

  IF fallback_subject_id IS NULL THEN
    SELECT id INTO fallback_subject_id
    FROM class_subjects
    WHERE deleted_at IS NULL AND is_active = true
    ORDER BY sort_order ASC
    LIMIT 1;
  END IF;

  IF fallback_subject_id IS NULL THEN
    SELECT id INTO fallback_category_id
    FROM class_categories
    WHERE deleted_at IS NULL
    ORDER BY sort_order ASC
    LIMIT 1;

    IF fallback_category_id IS NULL THEN
      INSERT INTO class_categories (id, name, slug, description, is_active, sort_order, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'General',
        'general',
        'System category for backfilled class subjects',
        true,
        0,
        NOW(),
        NOW()
      )
      RETURNING id INTO fallback_category_id;
    END IF;

    INSERT INTO class_subjects (id, category_id, name, slug, description, is_active, sort_order, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      fallback_category_id,
      'General',
      'general',
      'System subject assigned to legacy classes without a subject',
      true,
      0,
      NOW(),
      NOW()
    )
    RETURNING id INTO fallback_subject_id;
  END IF;

  UPDATE recurring_schedules
  SET subject_id = fallback_subject_id, updated_at = NOW()
  WHERE subject_id IS NULL;

  UPDATE class_instances
  SET subject_id = fallback_subject_id, updated_at = NOW()
  WHERE subject_id IS NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "class_instances" ALTER COLUMN "subject_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "subject_id" SET NOT NULL;
