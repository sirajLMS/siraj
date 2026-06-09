CREATE OR REPLACE FUNCTION handle_class_quota_deduction()
RETURNS TRIGGER AS $$
DECLARE
    is_old_deducted BOOLEAN;
    is_new_deducted BOOLEAN;
BEGIN
    IF TG_OP = 'INSERT' THEN
        is_old_deducted := false;
    ELSE
        is_old_deducted := OLD.quota_deducted AND (OLD.deleted_at IS NULL);
    END IF;

    IF TG_OP = 'DELETE' THEN
        is_new_deducted := false;
    ELSE
        is_new_deducted := NEW.quota_deducted AND (NEW.deleted_at IS NULL);
    END IF;

    IF NOT is_old_deducted AND is_new_deducted THEN
        UPDATE students
        SET classes_remaining = classes_remaining - 1
        WHERE id = NEW.student_id;
    ELSIF is_old_deducted AND NOT is_new_deducted THEN
        UPDATE students
        SET classes_remaining = classes_remaining + 1
        WHERE id = COALESCE(NEW.student_id, OLD.student_id);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_class_quota_deduction
AFTER INSERT OR UPDATE OR DELETE ON class_instances
FOR EACH ROW EXECUTE FUNCTION handle_class_quota_deduction();
