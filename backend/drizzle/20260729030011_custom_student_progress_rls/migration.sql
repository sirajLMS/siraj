-- Source: student_progress_rls.sql
-- Enable RLS on the table
ALTER TABLE "student_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "student_progress" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
-- Drop policies if they exist for idempotency
DROP POLICY IF EXISTS student_progress_teacher_policy ON "student_progress";--> statement-breakpoint
DROP POLICY IF EXISTS student_progress_parent_policy ON "student_progress";--> statement-breakpoint
-- 1. Teacher Policy: Allows teachers to manage progress for students they teach
-- A teacher can manage a progress record if they are the one who logged it
CREATE POLICY student_progress_teacher_policy ON "student_progress"
FOR ALL
USING (
    teacher_id IN (SELECT id FROM teachers WHERE user_id = current_user_id())
)
WITH CHECK (
    teacher_id IN (SELECT id FROM teachers WHERE user_id = current_user_id())
);--> statement-breakpoint
-- 2. Parent Policy: Allows parents to view progress for their children if parent_visible is true
-- current_user_id() is defined in permissions_rls_policies.sql
CREATE POLICY student_progress_parent_policy ON "student_progress"
FOR SELECT
USING (
    parent_visible = true 
    AND 
    student_id IN (
        SELECT s.id 
        FROM students s 
        JOIN parents p ON s.parent_id = p.id 
        WHERE p.user_id = current_user_id()
    )
);--> statement-breakpoint

