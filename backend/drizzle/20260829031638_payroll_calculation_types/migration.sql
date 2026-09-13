DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calculation_status') THEN
        CREATE TYPE "calculation_status" AS ENUM('NOT_CALCULATED', 'CALCULATED', 'PARTIALLY', 'REFUND', 'WAITING_PAID', 'PAID');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_setting_category') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'system_setting_category' AND e.enumlabel = 'payroll'
    ) THEN
        ALTER TYPE "system_setting_category" ADD VALUE 'payroll';
    END IF;
END $$;