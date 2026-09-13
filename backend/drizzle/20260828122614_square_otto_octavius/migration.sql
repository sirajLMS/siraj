DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billed_unit') THEN
        CREATE TYPE "billed_unit" AS ENUM('CLASS_CREDIT', 'HOUR_CREDIT');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_gateway') THEN
        CREATE TYPE "payment_gateway" AS ENUM('NONE', 'PAYPAL', 'WESTERN_UNION', 'BANK', 'OTHER');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.payments_view'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'accounting.payments_view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.payments_manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'accounting.payments_manage';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'invoice_type' AND e.enumlabel = 'CREDIT_HOURS_PACKAGE'
    ) THEN
        ALTER TYPE "invoice_type" ADD VALUE 'CREDIT_HOURS_PACKAGE';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'ACCOUNTING_PAYMENT_RECORDED'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'ACCOUNTING_PAYMENT_RECORDED';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'ACCOUNTING_LOW_HOURS'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'ACCOUNTING_LOW_HOURS';
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "package_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"codename" varchar(50) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"credit_hours" numeric(12,2) NOT NULL,
	"price_amount" numeric(12,2) NOT NULL,
	"currency" "currency_code" NOT NULL,
	"validity_months" integer,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp(3) with time zone,
	CONSTRAINT "package_plans_credit_hours_positive_chk" CHECK ("credit_hours" > 0),
	CONSTRAINT "package_plans_price_amount_positive_chk" CHECK ("price_amount" > 0),
	CONSTRAINT "package_plans_sort_order_non_negative_chk" CHECK ("sort_order" >= 0)
);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "credit_hours" numeric(12,2);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "package_plan_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payment_gateway" "payment_gateway" DEFAULT 'NONE'::"payment_gateway" NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "credit_hours" numeric(12,2);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "is_paid_status_on" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payment_note" text;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN IF NOT EXISTS "change_amount_hours" numeric(12,2);--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "billed_unit" "billed_unit";--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "credit_hours_total" numeric(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "credit_hours_remaining" numeric(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_transactions" ALTER COLUMN "change_amount" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_package_plan_id_idx" ON "payments" ("package_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_payment_gateway_idx" ON "payments" ("payment_gateway");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_is_paid_status_on_idx" ON "payments" ("is_paid_status_on");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_transactions_student_change_hours_idx" ON "credit_transactions" ("student_id","change_amount_hours");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "package_plans_codename_active_unique_idx" ON "package_plans" ("codename") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "package_plans_active_sort_idx" ON "package_plans" ("active","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "package_plans_deleted_at_idx" ON "package_plans" ("deleted_at");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_package_plan_id_package_plans_id_fkey" FOREIGN KEY ("package_plan_id") REFERENCES "package_plans"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_change_amount_xor_chk" CHECK ((("change_amount" IS NOT NULL AND "change_amount_hours" IS NULL) OR ("change_amount" IS NULL AND "change_amount_hours" IS NOT NULL)));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "students" ADD CONSTRAINT "students_credit_hours_remaining_chk" CHECK ("credit_hours_remaining" >= 0);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "students" ADD CONSTRAINT "students_credit_hours_total_chk" CHECK ("credit_hours_total" >= 0);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;