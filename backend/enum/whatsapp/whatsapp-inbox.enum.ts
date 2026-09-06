/**
 * WhatsApp inbox + webhook ingest enums (multi-number + coexistence).
 *
 * Backend-only enums registered in `backend/db/schema/enums.ts` (PG dialect)
 * and `backend/graphql/pothos/shared/enum.pothos.ts` (GraphQL exposure).
 */

/**
 * Provenance of a persisted WhatsApp message: user-sent inbound, echo of a
 * phone-app (Business app) send mirrored into the inbox, or an API-originated
 * outbound template/message sent by this system.
 */
export enum WhatsappMessageDirection {
  INBOUND = "INBOUND",
  ECHO = "ECHO",
  API_OUTBOUND = "API_OUTBOUND",
}

/**
 * Durable webhook event queue status. Events are inserted pre-200 (persist
 * first, ack fast); claiming flips PENDING → PROCESSING inside the claim
 * transaction so a racing worker cannot re-claim the same row, and poison
 * rows are parked in FAILED for the sweeper to surface rather than silently
 * dropped. A PROCESSING row whose worker crashed becomes re-claimable via the
 * sweeper once the per-attempt backoff horizon elapses.
 */
export enum WhatsappWebhookEventStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED",
}
