DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_channel' AND e.enumlabel = 'WHATSAPP'
    ) THEN
        ALTER TYPE "notification_channel" ADD VALUE 'WHATSAPP';
    END IF;
END $$;