ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "calculated_duration" integer;--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "teacher_paid_amount" text;--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "teacher_paid_currency" "currency_code";--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "calculation_status" "calculation_status" DEFAULT 'NOT_CALCULATED'::"calculation_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "is_partial_percentage" integer;--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "payroll_note" varchar(2000);--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "payroll_calculated_at" timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "payroll_calculated_by" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_instances_calculation_status_idx" ON "class_instances" ("calculation_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_instances_teacher_paid_amount_idx" ON "class_instances" ("teacher_paid_amount");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_instances_payroll_calculated_at_idx" ON "class_instances" ("payroll_calculated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_instances_teacher_status_scheduled_idx" ON "class_instances" ("teacher_id","calculation_status","scheduled_start_at");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_payroll_calculated_by_users_id_fkey" FOREIGN KEY ("payroll_calculated_by") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_partial_percentage_chk" CHECK (
        ("calculation_status" != 'PARTIALLY' OR "is_partial_percentage" IS NOT NULL) AND
        ("calculation_status" = 'PARTIALLY' OR "is_partial_percentage" IS NULL) AND
        ("is_partial_percentage" IS NULL OR ("is_partial_percentage" >= 0 AND "is_partial_percentage" <= 100))
      );
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_calculated_status_amount_chk" CHECK (
        ("calculation_status" != 'REFUND' OR "teacher_paid_amount" = '0') AND
        ("calculation_status" != 'CALCULATED' OR "calculated_duration" IS NOT NULL)
      );
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;