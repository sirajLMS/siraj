DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'settings.view'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'settings.view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'settings.edit_general'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'settings.edit_general';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'settings.edit_env'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'settings.edit_env';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'settings.edit_session'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'settings.edit_session';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'settings.audit_view'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'settings.audit_view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'settings.site_content_manage'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'settings.site_content_manage';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'settings.timezones_view'
    ) THEN
        ALTER TYPE app_permission ADD VALUE 'settings.timezones_view';
    END IF;
END $$;--> statement-breakpoint

