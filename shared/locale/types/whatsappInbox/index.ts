/**
 * WhatsApp Inbox i18n namespace — compile-time TypeScript schema.
 *
 * Strings for the read-only Settings ▸ WhatsApp ▸ Inbox tab: conversation
 * list, thread, message direction/ECHO markers, and media placeholder states.
 * The `whatsapp` namespace owns settings/config surfaces; this namespace owns
 * the inbox surface per the whatsapp2 plan (Phase 10).
 *
 * shared/ cannot import from @/backend/**, so Meta-side enum values appear in
 * comments only; label keys follow the `WhatsappMessageDirection` values
 * (INBOUND / ECHO / API_OUTBOUND).
 */
export interface WhatsappInboxLabels {
  // ─── Tab header ───────────────────────────────────────────────────────
  readonly title: string;
  readonly subtitle: string;

  // ─── Account filter + search ──────────────────────────────────────────
  readonly accountFilterLabel: string;
  readonly accountFilterAll: string;
  readonly searchPlaceholder: string;

  // ─── Conversation list columns ────────────────────────────────────────
  readonly columnContact: string;
  readonly columnNumber: string;
  readonly columnLastMessage: string;
  readonly columnLastActivity: string;
  readonly columnAccount: string;

  // ─── Empty / notice states ────────────────────────────────────────────
  /** Bold heading + grid/card no-rows message for an empty inbox. */
  readonly noConversations: string;
  /** Explainer copy under the empty-state heading (incl. coexistence 24h hint). */
  readonly emptyStateDescription: string;
  /** Eyebrow title of the persistent READ-ONLY info banner. */
  readonly readOnlyBannerTitle: string;
  /** Guidance copy when history sync was declined on the paired phone. */
  readonly historyDeclinedNotice: string;
  /** Title of the prominent declined history-sync banner. */
  readonly syncDeclinedTitle: string;
  /** Title of the centered empty-state block when the declined number has no conversations. */
  readonly syncDeclinedEmptyTitle: string;
  readonly readOnlyNotice: string;

  // ─── Thread ───────────────────────────────────────────────────────────
  readonly openThread: string;
  readonly threadMessagesEmpty: string;
  /** Back button aria-label on the thread pane. */
  readonly back: string;
  /** Day-separator pill labels between message groups. */
  readonly dayToday: string;
  readonly dayYesterday: string;

  // ─── Direction markers (WhatsappMessageDirection) ─────────────────────
  readonly directionInbound: string;
  readonly directionEcho: string;
  readonly directionApiOutbound: string;

  // ─── Media placeholder states ─────────────────────────────────────────
  readonly mediaPlaceholder: string;
  readonly mediaPending: string;
  readonly mediaExpired: string;

  // ─── Revoke / edit markers ────────────────────────────────────────────
  readonly messageRevoked: string;
  readonly editedLabel: string;

  // ─── Error state ──────────────────────────────────────────────────────
  readonly loadErrorTitle: string;
  readonly loadErrorDescription: string;
  /** Retry button on the load-error alert. */
  readonly retry: string;
}
