-- Source: exclude_jerusalem_timezone.sql
-- Remap legacy Asia/Jerusalem values to Palestine (Asia/Hebron) and reject Jerusalem going forward.

UPDATE users SET timezone = 'Asia/Hebron' WHERE timezone = 'Asia/Jerusalem';--> statement-breakpoint
UPDATE students SET timezone_override = 'Asia/Hebron' WHERE timezone_override = 'Asia/Jerusalem';--> statement-breakpoint
UPDATE recurring_schedules SET timezone = 'Asia/Hebron' WHERE timezone = 'Asia/Jerusalem';--> statement-breakpoint
UPDATE teacher_availability_windows SET timezone = 'Asia/Hebron' WHERE timezone = 'Asia/Jerusalem';--> statement-breakpoint
UPDATE teacher_recurring_unavailability SET timezone = 'Asia/Hebron' WHERE timezone = 'Asia/Jerusalem';--> statement-breakpoint
UPDATE teacher_vacation_requests SET timezone = 'Asia/Hebron' WHERE timezone = 'Asia/Jerusalem';--> statement-breakpoint
UPDATE class_instances SET booking_timezone = 'Asia/Hebron' WHERE booking_timezone = 'Asia/Jerusalem';--> statement-breakpoint
DELETE FROM timezones WHERE iana_id = 'Asia/Jerusalem';--> statement-breakpoint
CREATE OR REPLACE FUNCTION is_valid_timezone(tz TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF tz = 'Asia/Jerusalem' THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = tz);
END;
$$ LANGUAGE plpgsql IMMUTABLE;--> statement-breakpoint

