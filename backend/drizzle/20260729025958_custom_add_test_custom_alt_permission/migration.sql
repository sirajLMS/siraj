DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'test.custom_alt'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'test.custom_alt';
    END IF;
END $$;--> statement-breakpoint

