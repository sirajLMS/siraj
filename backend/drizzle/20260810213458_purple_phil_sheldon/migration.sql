DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'profile.core_status.view_own'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'profile.core_status.view_own';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'profile.core_status.view_other'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'profile.core_status.view_other';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'profile.core_status.edit_own'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'profile.core_status.edit_own';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'profile.core_status.edit_other'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'profile.core_status.edit_other';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'user.admin_reset_password'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'user.admin_reset_password';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'PASSWORD_RESET_BY_ADMIN'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'PASSWORD_RESET_BY_ADMIN';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'USER_STATUS_CHANGED'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'USER_STATUS_CHANGED';
    END IF;
END $$;