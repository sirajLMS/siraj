/**
 * WhatsApp Conversations (`/whatsapp` workspace) enums.
 *
 * Backend-only enums: canonical definitions live here.
 * `WhatsappTestRecipientStatus` is stored as a varchar column
 * (`whatsapp_test_recipients.status`, matching the tier/quality style of
 * closed short status sets) rather than a PG enum. GraphQL exposure happens
 * via `backend/graphql/pothos/shared/enum.pothos.ts`.
 */

/**
 * Registry status of a recipient phone number for a Meta test sender number
 * (test numbers may only message pre-approved recipients). PENDING rows were
 * added by an operator but not yet proven reachable; ALLOWED rows passed the
 * hello_world verify test-send and may receive messages from the test number.
 */
export enum WhatsappTestRecipientStatus {
  PENDING = "PENDING",
  ALLOWED = "ALLOWED",
}

/**
 * Composer send mode on the conversations workspace: free-text is only legal
 * inside Meta's 24h customer service window (gated on the conversation's
 * `lastInboundMessageAt`); template sends are allowed at any time.
 */
export enum WhatsappConversationSendMode {
  TEXT = "TEXT",
  TEMPLATE = "TEMPLATE",
}
