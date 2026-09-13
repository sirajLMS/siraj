DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'cron.manage'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'cron.manage';
    END IF;
END $$;--> statement-breakpoint

