CREATE OR REPLACE FUNCTION enforce_class_rescheduling_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_orig_state TEXT;
    v_orig_outcome TEXT;
    v_orig_rescheduled BOOLEAN;
    v_orig_rate_amount NUMERIC;
    v_orig_rate_currency TEXT;
BEGIN
    -- 1. Prevent self-referencing
    IF NEW.original_class_id IS NOT NULL AND NEW.original_class_id = NEW.id THEN
        RAISE EXCEPTION 'A class cannot be rescheduled to itself';
    END IF;

    -- 2. If is_rescheduled is set to true, ensure quota_deducted is false, execution_state is not completed, and outcome is not taken
    IF NEW.is_rescheduled THEN
        NEW.quota_deducted := false;
        IF NEW.execution_state = 'COMPLETED' OR NEW.outcome = 'TAKEN' THEN
            RAISE EXCEPTION 'A rescheduled class cannot be completed or taken';
        END IF;
    END IF;

    -- 3. Rescheduling rules when original_class_id is set
    IF NEW.original_class_id IS NOT NULL THEN
        -- Fetch original class info
        SELECT execution_state, outcome, is_rescheduled, rate_amount, rate_currency
        INTO v_orig_state, v_orig_outcome, v_orig_rescheduled, v_orig_rate_amount, v_orig_rate_currency
        FROM class_instances
        WHERE id = NEW.original_class_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Original class not found';
        END IF;

        -- Prevent rescheduling completed or taken classes
        IF v_orig_state = 'COMPLETED' OR v_orig_outcome = 'TAKEN' THEN
            RAISE EXCEPTION 'Cannot reschedule a completed or taken class';
        END IF;

        -- Prevent rescheduling a class that was already rescheduled
        -- (Only check this on INSERT, or if original_class_id has changed, to allow updates to existing rescheduled classes)
        IF (TG_OP = 'INSERT' OR OLD.original_class_id IS NULL OR OLD.original_class_id != NEW.original_class_id) AND v_orig_rescheduled THEN
            RAISE EXCEPTION 'Cannot reschedule a class that has already been rescheduled';
        END IF;

        -- Inherit rate from original class if not overridden
        IF NEW.rate_amount IS NULL THEN
            NEW.rate_amount := v_orig_rate_amount;
            NEW.rate_currency := v_orig_rate_currency;
        END IF;

        -- Automatically close the original class by marking it as rescheduled and refunding quota
        UPDATE class_instances
        SET is_rescheduled = true,
            quota_deducted = false,
            outcome = 'PENDING',
            execution_state = 'NOT_ACTIVATED',
            updated_at = clock_timestamp()
        WHERE id = NEW.original_class_id
          AND (is_rescheduled = false OR quota_deducted = true OR outcome != 'PENDING' OR execution_state != 'NOT_ACTIVATED');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_class_rescheduling_rules ON class_instances;
CREATE TRIGGER trg_enforce_class_rescheduling_rules
BEFORE INSERT OR UPDATE ON class_instances
FOR EACH ROW EXECUTE FUNCTION enforce_class_rescheduling_rules();
