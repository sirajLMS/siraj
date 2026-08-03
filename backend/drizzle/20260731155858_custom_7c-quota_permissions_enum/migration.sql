DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'quotas.view'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'quotas.view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'quotas.manage'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'quotas.manage';
    END IF;
END $$;--> statement-breakpoint

