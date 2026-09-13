DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'settings.appearance_manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'settings.appearance_manage';
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "appearance_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"primary_main" text NOT NULL,
	"secondary_main" text NOT NULL,
	"logo_url" text,
	"site_name" text NOT NULL,
	"site_title" text NOT NULL,
	"site_description" text NOT NULL,
	"default_color_scheme" text NOT NULL,
	"draft_fields" jsonb NOT NULL,
	"updated_by_user_id" uuid,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appearance_settings_updated_by_user_id_idx" ON "appearance_settings" ("updated_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appearance_settings_updated_at_idx" ON "appearance_settings" ("updated_at");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "appearance_settings" ADD CONSTRAINT "appearance_settings_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;