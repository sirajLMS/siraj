DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.reports_view'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'accounting.reports_view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.reports_manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'accounting.reports_manage';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.carryover_view'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'accounting.carryover_view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.carryover_manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'accounting.carryover_manage';
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carryover_balance_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"carryover_id" uuid NOT NULL,
	"class_instance_id" uuid NOT NULL,
	"original_amount" text NOT NULL,
	"original_currency" "currency_code" NOT NULL,
	"original_status" varchar(32) NOT NULL,
	"converted_amount" text,
	"converted_currency" "currency_code",
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carryover_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"teacher_id" uuid NOT NULL,
	"students_count" integer,
	"students_text" varchar(500),
	"total_duration" text,
	"payable" text NOT NULL,
	"teacher_currency" "currency_code" NOT NULL,
	"paid" text DEFAULT '0' NOT NULL,
	"from_date" text,
	"to_date" text,
	"payment_date" text,
	"is_disabled_teacher" boolean DEFAULT false NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"expense_id" uuid,
	"note" text,
	"created_by_user_id" uuid NOT NULL,
	"paid_by_user_id" uuid,
	"paid_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "carryover_balance_id" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_instances_carryover_balance_id_idx" ON "class_instances" ("carryover_balance_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carryover_balance_items_carryover_id_idx" ON "carryover_balance_items" ("carryover_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carryover_balance_items_class_instance_id_idx" ON "carryover_balance_items" ("class_instance_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carryover_balances_teacher_id_idx" ON "carryover_balances" ("teacher_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carryover_balances_is_paid_idx" ON "carryover_balances" ("is_paid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carryover_balances_payment_date_idx" ON "carryover_balances" ("payment_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carryover_balances_from_to_idx" ON "carryover_balances" ("from_date","to_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carryover_balances_is_disabled_teacher_idx" ON "carryover_balances" ("is_disabled_teacher");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carryover_balances_expense_id_idx" ON "carryover_balances" ("expense_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carryover_balances_created_by_user_id_idx" ON "carryover_balances" ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "carryover_balances_expense_id_unique_idx" ON "carryover_balances" ("expense_id");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_carryover_balance_id_carryover_balances_id_fkey" FOREIGN KEY ("carryover_balance_id") REFERENCES "carryover_balances"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "carryover_balance_items" ADD CONSTRAINT "carryover_balance_items_carryover_id_carryover_balances_id_fkey" FOREIGN KEY ("carryover_id") REFERENCES "carryover_balances"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "carryover_balance_items" ADD CONSTRAINT "carryover_balance_items_2HYuvyPXlTJk_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "carryover_balances" ADD CONSTRAINT "carryover_balances_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "carryover_balances" ADD CONSTRAINT "carryover_balances_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "carryover_balances" ADD CONSTRAINT "carryover_balances_paid_by_user_id_users_id_fkey" FOREIGN KEY ("paid_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;