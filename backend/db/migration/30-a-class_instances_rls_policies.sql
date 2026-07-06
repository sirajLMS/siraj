-- Class Instance RLS policies for scoping access based on current_user_id()

ALTER TABLE "class_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_instances" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_instances_access_select_policy ON "class_instances";
CREATE POLICY class_instances_access_select_policy ON "class_instances"
AS RESTRICTIVE FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    (NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id()))
    OR
    (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))
  )
);

DROP POLICY IF EXISTS class_instances_access_update_policy ON "class_instances";
CREATE POLICY class_instances_access_update_policy ON "class_instances"
AS RESTRICTIVE FOR UPDATE
USING (
  deleted_at IS NULL
  AND (
    (NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id()))
    OR
    (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))
  )
)
WITH CHECK (
  (deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true'))
  AND (
    (NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id()))
    OR
    (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))
  )
);
