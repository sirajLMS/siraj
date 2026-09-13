DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_webhook_event_status') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'whatsapp_webhook_event_status' AND e.enumlabel = 'PROCESSING'
    ) THEN
        ALTER TYPE whatsapp_webhook_event_status ADD VALUE 'PROCESSING';
    END IF;
END $$;--> statement-breakpoint

