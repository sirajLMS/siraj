CREATE OR REPLACE FUNCTION enforce_teacher_banking_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Do not allow modifying historically closed records
    IF OLD.valid_until IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot modify historical banking records';
    END IF;

    -- Do not allow modifying banking fields of an active record
    IF OLD.beneficiary_name IS DISTINCT FROM NEW.beneficiary_name OR
       OLD.bank_name IS DISTINCT FROM NEW.bank_name OR
       OLD.account_number IS DISTINCT FROM NEW.account_number OR
       OLD.routing_number IS DISTINCT FROM NEW.routing_number OR
       OLD.swift_bic IS DISTINCT FROM NEW.swift_bic OR
       OLD.iban IS DISTINCT FROM NEW.iban THEN
        RAISE EXCEPTION 'Cannot modify banking fields directly. Close the current record and insert a new one.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_teacher_banking_immutability
BEFORE UPDATE ON teacher_banking_details_history
FOR EACH ROW EXECUTE FUNCTION enforce_teacher_banking_immutability();
