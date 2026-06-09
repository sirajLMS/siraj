CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"payment_date" timestamp(3) with time zone NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"transaction_id" varchar(255),
	"gateway_response" text,
	"refunded_amount" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"idempotency_key" varchar(255),
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "payments_invoice_id_idx" ON "payments" ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_transaction_id_idx" ON "payments" ("transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_unique_idx" ON "payments" ("idempotency_key");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT;