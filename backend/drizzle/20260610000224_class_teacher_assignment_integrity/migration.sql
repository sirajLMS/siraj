-- Function to enforce that the teacher in a class instance is assigned to the student
CREATE OR REPLACE FUNCTION fn_enforce_class_teacher_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there is an active assignment for this teacher and student
    -- We consider an assignment active if ended_at is NULL or if the class starts before the assignment ends
    IF NOT EXISTS (
        SELECT 1 
        FROM teacher_assignments 
        WHERE student_id = NEW.student_id 
          AND teacher_id = NEW.teacher_id
          AND (ended_at IS NULL OR ended_at >= NEW.scheduled_start_at)
    ) THEN
        RAISE EXCEPTION 'Teacher % is not assigned to student % for the scheduled time %', NEW.teacher_id, NEW.student_id, NEW.scheduled_start_at;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists for idempotency
DROP TRIGGER IF EXISTS trg_enforce_class_teacher_assignment ON class_instances;

-- Create the trigger
CREATE TRIGGER trg_enforce_class_teacher_assignment
BEFORE INSERT OR UPDATE ON class_instances
FOR EACH ROW EXECUTE FUNCTION fn_enforce_class_teacher_assignment();
