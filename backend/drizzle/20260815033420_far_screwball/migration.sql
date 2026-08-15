DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'auth.view_own_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'auth.view_own_profile';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'auth.edit_own_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'auth.edit_own_profile';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'teacher.view_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'teacher.view_profile';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'teacher.view_own_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'teacher.view_own_profile';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'teacher.edit_own_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'teacher.edit_own_profile';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'staff.edit_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'staff.edit_profile';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'parent.view_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'parent.view_profile';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'parent.view_own_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'parent.view_own_profile';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'parent.edit_own_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'parent.edit_own_profile';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'user.view_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'user.view_profile';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'user.edit_profile'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'user.edit_profile';
    END IF;
END $$;