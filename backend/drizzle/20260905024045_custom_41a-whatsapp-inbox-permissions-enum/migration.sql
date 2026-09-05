DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'whatsapp.inbox_view'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'whatsapp.inbox_view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'whatsapp.inbox_manage'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'whatsapp.inbox_manage';
    END IF;
END $$;--> statement-breakpoint

