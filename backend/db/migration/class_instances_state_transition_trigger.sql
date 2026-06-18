-- State Machine transition triggers for class_instances

CREATE OR REPLACE FUNCTION fn_enforce_class_instance_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.execution_state IS DISTINCT FROM NEW.execution_state THEN
        -- COMPLETED can only transition to NOT_ACTIVATED (revert) or remain COMPLETED
        IF OLD.execution_state = 'COMPLETED' AND NEW.execution_state IN ('ACTIVATED', 'RUNNING') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot reactivate a COMPLETED class instance.';
        END IF;

        -- RUNNING cannot transition to ACTIVATED
        IF OLD.execution_state = 'RUNNING' AND NEW.execution_state = 'ACTIVATED' THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move a RUNNING class instance back to ACTIVATED.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_class_instance_transition ON class_instances;
CREATE TRIGGER trg_enforce_class_instance_transition
BEFORE UPDATE ON class_instances
FOR EACH ROW EXECUTE FUNCTION fn_enforce_class_instance_transition();
