-- Migration: WhatsApp webhook event queue — PROCESSING status (mid-point review fix)
-- Extends `whatsapp_webhook_event_status` with PROCESSING so `claimBatch` can flip
-- claimed rows inside the claim transaction, closing the double-claim race between
-- concurrent workers (`after()` tick + sweeper cron). Stale PROCESSING rows remain
-- reclaimable through the sweeper's backoff-anchored claim predicate.
--
-- Idempotent: safe to re-run. `AFTER 'PENDING'` keeps sort order matching the
-- lifecycle (PENDING → PROCESSING → PROCESSED | FAILED).

ALTER TYPE whatsapp_webhook_event_status ADD VALUE IF NOT EXISTS 'PROCESSING' AFTER 'PENDING';
