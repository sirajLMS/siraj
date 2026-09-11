/**
 * WhatsApp Conversations i18n namespace — compile-time TypeScript schema.
 *
 * Strings for the `/whatsapp` workspace page: account selector, conversation
 * list + thread, composer (free-text gated by the 24h service window, template
 * mode), Meta test-number banner, and the local test-recipient registry panel
 * with its add/remove dialogs. The read-only `whatsappInbox` namespace owns
 * the Settings ▸ WhatsApp inbox tab; the `whatsapp` namespace owns settings —
 * this namespace owns the full conversations workspace.
 *
 * Interpolation uses ICU `{var}` placeholders consumed by the shared locale
 * formatters (`shared/locale/format.ts`, `shared/locale/client/format.ts`).
 */
export interface WhatsappConversationsLabels {
  // ─── Page header ────────────────────────────────────────────────────────
  readonly title: string;
  readonly subtitle: string;

  // ─── Account selector ───────────────────────────────────────────────────
  readonly accountSelectorLabel: string;

  // ─── Conversation list ──────────────────────────────────────────────────
  /** Accessible name for the conversation rows region. */
  readonly columnContact: string;
  readonly searchPlaceholder: string;
  /** Bold heading when the selected account has no conversations. */
  readonly noConversations: string;
  /** Explainer copy under the no-conversations heading. */
  readonly emptyStateDescription: string;
  /** Heading when the tenant has no connected WhatsApp numbers at all. */
  readonly noAccountsTitle: string;
  readonly noAccountsDescription: string;
  readonly loadErrorDescription: string;
  readonly retry: string;

  // ─── Thread ─────────────────────────────────────────────────────────────
  /** Accessible heading for the open thread pane; `{name}` = contact display name. */
  readonly threadHeading: string;
  readonly threadMessagesEmpty: string;
  /** Thread header timestamp line; `{date}` = formatted last-message time. */
  readonly lastMessageAt: string;

  // ─── Composer ───────────────────────────────────────────────────────────
  /** Accessible name for the text/template mode toggle. */
  readonly composerModeLabel: string;
  readonly composerModeText: string;
  readonly composerModeTemplate: string;
  readonly composerTextPlaceholder: string;
  readonly composerTemplatePlaceholder: string;
  readonly composerRecipientLabel: string;
  readonly composerRecipientPlaceholder: string;
  readonly sendButton: string;
  /** Shown while the 24h service window is open; `{duration}` = time remaining. */
  readonly windowOpenHint: string;
  readonly windowClosedHint: string;
  readonly sendErrorTitle: string;

  // ─── Template mode fields ───────────────────────────────────────────────
  readonly templateNameLabel: string;
  readonly templateNamePlaceholder: string;
  readonly templateLanguageLabel: string;
  readonly templateLanguagePlaceholder: string;

  // ─── Test-number banner + badges ────────────────────────────────────────
  readonly testNumberBannerTitle: string;
  readonly testNumberBannerBody: string;
  /** Link text pointing to the Meta App Dashboard recipients page. */
  readonly metaDashboardLinkText: string;
  /** Compact chip on a test number (also reused by the settings NumberCard). */
  readonly testNumberBadge: string;
  /** Chip shown to roles with view-only access to the conversations page. */
  readonly readOnlyBadge: string;

  // ─── Recipients panel ───────────────────────────────────────────────────
  readonly recipientsTitle: string;
  readonly recipientsEmptyTitle: string;
  readonly recipientsEmptyDescription: string;
  readonly recipientAdd: string;
  readonly recipientRemove: string;
  readonly recipientVerify: string;
  readonly recipientStatusPending: string;
  readonly recipientStatusAllowed: string;
  /** `{date}` = formatted last verification time. */
  readonly recipientLastChecked: string;
  /** `{code}` = Meta error code (e.g. 131030) from the last verification. */
  readonly recipientErrorCode: string;
  /** Catch-all for add-recipient failures without a known error code. */
  readonly recipientAddFailed: string;

  // ─── Recipient add dialog ───────────────────────────────────────────────
  readonly addRecipientDialogTitle: string;
  readonly recipientPhoneLabel: string;
  readonly recipientPhonePlaceholder: string;
  readonly recipientNoteLabel: string;
  readonly recipientNotePlaceholder: string;
  readonly dialogCancel: string;
  readonly dialogSave: string;

  // ─── Recipient remove dialog ────────────────────────────────────────────
  readonly removeRecipientDialogTitle: string;
  /** Confirmation copy; `{phone}` = the recipient's phone number. */
  readonly removeRecipientConfirm: string;

  // ─── New-conversation flow (phase 2) ────────────────────────────────────
  /** Header action button that starts a brand-new conversation. */
  readonly newConversation: string;
  /** Title of the new-conversation dialog/card. */
  readonly newConversationTitle: string;
  /** Hint that a template message is required to open a brand-new thread. */
  readonly newConversationSubtitle: string;

  // ─── Settings manage-recipients affordance (phase 2) ────────────────────
  /** Icon-button label on test-number settings cards. */
  readonly manageRecipients: string;
  /** Title of the manage-recipients dialog on the settings numbers cards. */
  readonly manageRecipientsTitle: string;
  /** Explainer shown in the manage-recipients dialog. */
  readonly manageRecipientsHint: string;
}
