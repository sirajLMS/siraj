/**
 * WhatsApp Groups i18n namespace — compile-time TypeScript schema.
 *
 * Strings for the WhatsApp Groups dashboard surface: groups listing,
 * group creation (subject/description + approval mode), Meta sync,
 * invite-link management, join-request review, participant management,
 * and in-group messaging. Sits alongside the `whatsappConversations`
 * namespace, which owns the one-to-one conversations workspace.
 *
 * Interpolation uses ICU `{var}` placeholders consumed by the shared locale
 * formatters (`shared/locale/format.ts`, `shared/locale/client/format.ts`).
 */
export interface WhatsappGroupsLabels {
  // ─── Page header ────────────────────────────────────────────────────────
  readonly title: string;
  readonly subtitle: string;

  // ─── Groups list ────────────────────────────────────────────────────────
  readonly listTitle: string;
  readonly listSubtitle: string;
  readonly searchPlaceholder: string;
  /** Empty state when the tenant has groups to create but has none yet. */
  readonly emptyState: string;
  /** Empty state when the tenant has no connected WhatsApp numbers at all. */
  readonly noAccountsState: string;

  // ─── Create group ───────────────────────────────────────────────────────
  /** Header action button that opens the create-group dialog. */
  readonly createGroup: string;
  readonly createGroupTitle: string;
  readonly createGroupDescription: string;
  readonly subjectLabel: string;
  readonly subjectPlaceholder: string;
  readonly descriptionLabel: string;
  readonly descriptionPlaceholder: string;
  /** Accessible name for the join-approval mode selector. */
  readonly approvalModeLabel: string;
  readonly approvalModeAuto: string;
  readonly approvalModeRequired: string;

  // ─── Meta sync ──────────────────────────────────────────────────────────
  readonly syncGroups: string;
  readonly syncStarted: string;
  /** Snackbar result after a Meta sync completes; `{count}` = groups synced. */
  readonly syncCompleted: string;

  // ─── Invite link ────────────────────────────────────────────────────────
  readonly inviteLinkTitle: string;
  readonly inviteLinkEmpty: string;
  readonly copyInviteLink: string;
  /** Brief feedback shown after the invite link was copied to the clipboard. */
  readonly copied: string;
  readonly resetInviteLink: string;
  /** Confirmation copy for the reset-invite-link action. */
  readonly resetInviteLinkConfirm: string;
  /** Explainer warning shown alongside the reset confirmation. */
  readonly resetInviteLinkWarning: string;

  // ─── Join requests ──────────────────────────────────────────────────────
  readonly joinRequestsTitle: string;
  readonly joinRequestsEmpty: string;
  /** Compact chip on the join-requests tab; `{count}` = pending requests. */
  readonly pendingBadge: string;
  readonly approveRequest: string;
  readonly rejectRequest: string;
  /** Toast after a request is approved. */
  readonly approved: string;
  /** Toast after a request is rejected. */
  readonly rejected: string;

  // ─── Participants ───────────────────────────────────────────────────────
  readonly participantsTitle: string;
  readonly participantsEmpty: string;
  readonly removeParticipant: string;
  /** Confirmation copy for the remove-participant action. */
  readonly removeParticipantConfirm: string;

  // ─── Group messages ─────────────────────────────────────────────────────
  readonly messagesTitle: string;
  readonly messagesEmpty: string;
  readonly messagePlaceholder: string;
  readonly send: string;
  readonly sending: string;
  readonly pin: string;
  readonly unpin: string;
  readonly pinned: string;

  // ─── Delete group ───────────────────────────────────────────────────────
  readonly deleteGroup: string;
  /** Confirmation copy for the delete-group action. */
  readonly deleteGroupConfirm: string;
  /** Explainer warning shown alongside the delete confirmation. */
  readonly deleteGroupWarning: string;

  // ─── Errors, permissions & actions ──────────────────────────────────────
  readonly errorGeneric: string;
  readonly permissionDenied: string;
  readonly loadingMore: string;
  readonly refresh: string;

  // ─── Timestamps & badges ────────────────────────────────────────────────
  /** `{date}` = formatted group creation time. */
  readonly createdAtLabel: string;
  /** `{date}` = formatted last Meta sync time. */
  readonly lastSyncedAtLabel: string;
  /** Chip on a group whose sync is suspended on Meta's side. */
  readonly suspendedBadge: string;
  /** Chip on an active group. */
  readonly activeBadge: string;
}
