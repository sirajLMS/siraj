CREATE OR REPLACE FUNCTION check_class_instance_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- We only check if scheduled times or critical fields change
  IF TG_OP = 'UPDATE' AND 
     NEW.scheduled_start_at = OLD.scheduled_start_at AND 
     NEW.scheduled_end_at = OLD.scheduled_end_at AND
     NEW.teacher_id = OLD.teacher_id AND
     NEW.student_id = OLD.student_id AND
     NEW.zoom_meeting_url IS NOT DISTINCT FROM OLD.zoom_meeting_url AND
     NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at
  THEN
    RETURN NEW;
  END IF;

  -- Only check if the class is not being soft-deleted
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Check for Teacher Overlap
  IF EXISTS (
    SELECT 1 FROM class_instances 
    WHERE teacher_id = NEW.teacher_id
      AND (TG_OP = 'INSERT' OR id != NEW.id)
      AND deleted_at IS NULL
      AND (scheduled_start_at, scheduled_end_at) OVERLAPS (NEW.scheduled_start_at, NEW.scheduled_end_at)
  ) THEN
    RAISE EXCEPTION 'Teacher is already booked for this time period';
  END IF;

  -- Check for Student Overlap
  IF EXISTS (
    SELECT 1 FROM class_instances 
    WHERE student_id = NEW.student_id
      AND (TG_OP = 'INSERT' OR id != NEW.id)
      AND deleted_at IS NULL
      AND (scheduled_start_at, scheduled_end_at) OVERLAPS (NEW.scheduled_start_at, NEW.scheduled_end_at)
  ) THEN
    RAISE EXCEPTION 'Student is already booked for this time period';
  END IF;

  -- Check for Zoom URL Overlap
  IF NEW.zoom_meeting_url IS NOT NULL AND EXISTS (
    SELECT 1 FROM class_instances 
    WHERE zoom_meeting_url = NEW.zoom_meeting_url
      AND (TG_OP = 'INSERT' OR id != NEW.id)
      AND deleted_at IS NULL
      AND (scheduled_start_at, scheduled_end_at) OVERLAPS (NEW.scheduled_start_at, NEW.scheduled_end_at)
  ) THEN
    RAISE EXCEPTION 'Zoom meeting URL is already in use for this time period';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the BEFORE INSERT OR UPDATE trigger
DROP TRIGGER IF EXISTS class_instances_overlap_trigger ON class_instances;
CREATE TRIGGER class_instances_overlap_trigger
BEFORE INSERT OR UPDATE ON class_instances
FOR EACH ROW
EXECUTE FUNCTION check_class_instance_overlap();