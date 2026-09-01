DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_adjustment_type') THEN
        CREATE TYPE "credit_adjustment_type" AS ENUM('ADD', 'SUBTRACT', 'SUBTRACT_WITH_CARRYOVER');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'accounting.credits_manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'accounting.credits_manage';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'credit_reason' AND e.enumlabel = 'CREDIT_ADJUSTMENT_ADD'
    ) THEN
        ALTER TYPE "credit_reason" ADD VALUE 'CREDIT_ADJUSTMENT_ADD';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'credit_reason' AND e.enumlabel = 'CREDIT_ADJUSTMENT_SUBTRACT'
    ) THEN
        ALTER TYPE "credit_reason" ADD VALUE 'CREDIT_ADJUSTMENT_SUBTRACT';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'credit_reason' AND e.enumlabel = 'CREDIT_ADJUSTMENT_CARRYOVER'
    ) THEN
        ALTER TYPE "credit_reason" ADD VALUE 'CREDIT_ADJUSTMENT_CARRYOVER';
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN IF NOT EXISTS "adjustment_type" "credit_adjustment_type" DEFAULT 'ADD'::"credit_adjustment_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN IF NOT EXISTS "carryover_teacher_id" uuid;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN IF NOT EXISTS "carryover_from_date" text;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN IF NOT EXISTS "carryover_to_date" text;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN IF NOT EXISTS "carryover_payment_date" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_transactions_adjustment_type_idx" ON "credit_transactions" ("adjustment_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_transactions_carryover_teacher_id_idx" ON "credit_transactions" ("carryover_teacher_id");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_carryover_teacher_id_teachers_id_fkey" FOREIGN KEY ("carryover_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;