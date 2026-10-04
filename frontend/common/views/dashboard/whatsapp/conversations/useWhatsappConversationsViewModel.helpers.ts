import {
  type WhatsappAccountsQuery,
  WhatsappTestRecipientStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  buildPaginationArgs as buildSharedPaginationArgs,
  withVar as buildSharedWithVar,
  resolveAccountLabel,
} from "@/frontend/common/views/dashboard/whatsapp/__shared__";
import type {
  WhatsappConversationRow,
  WhatsappConversationsAccountOption,
  WhatsappConversationsLabelsBySection,
  WhatsappMessageRow,
  WhatsappRecipientViewRow,
  WhatsappTestRecipientRow,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { PAGE_SIZE } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.constants";
import type {
  ComposerState,
  RecipientDialogsState,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.state";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

export function buildPaginationArgs(page: number, pageSize: number) {
  return buildSharedPaginationArgs(page, pageSize);
}

export function withVar(template: string, variable: string, value: string): string {
  return buildSharedWithVar(template, variable, value);
}

/** Normalizes an E.164 value to Meta's digits-only wire form. */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function buildAccountOptions(
  rows: WhatsappAccountsQuery["whatsappAccounts"],
  locale: string
): WhatsappConversationsAccountOption[] {
  const options: WhatsappConversationsAccountOption[] = [];
  for (const row of rows ?? []) {
    if (row.id) {
      options.push({
        id: row.id,
        label: resolveAccountLabel(row, locale),
        isActive: row.isActive ?? false,
        isTestNumber: row.isTestNumber ?? false,
      });
    }
  }
  return options;
}

export function isConversationRow(row: { id: string | null }): row is WhatsappConversationRow {
  return row.id !== null;
}

export function isMessageRow(row: { id: string | null }): row is WhatsappMessageRow {
  return row.id !== null;
}

export function isRecipientRow(row: { id: string | null }): row is WhatsappTestRecipientRow {
  return row.id !== null;
}

/**
 * Page folded into the list-query variables: clamped against the most recent
 * server-reported total so a shrinking totalCount never keeps the query on a
 * page that no longer exists. Unclamped until the first payload lands.
 */
export function resolveListQueryPage(requestedPage: number, serverTotalCount: number | null): number {
  if (serverTotalCount === null) {
    return requestedPage;
  }
  return Math.min(requestedPage, Math.max(0, Math.ceil(serverTotalCount / PAGE_SIZE) - 1));
}

export function buildLabelsBySection(labels: WhatsappConversationsLabels): WhatsappConversationsLabelsBySection {
  return {
    shell: labels,
    list: labels,
    thread: labels,
    composer: labels,
    banner: labels,
    recipients: labels,
  };
}

export function buildRecipientViewRow(
  row: WhatsappTestRecipientRow,
  labels: Record<
    "recipientStatusAllowed" | "recipientStatusPending" | "recipientLastChecked" | "recipientErrorCode",
    string
  >,
  formatTimestamp: (iso: string | null) => string
): WhatsappRecipientViewRow {
  const status = row.status ?? WhatsappTestRecipientStatus.Pending;
  const allowed = status === WhatsappTestRecipientStatus.Allowed;
  return {
    id: row.id,
    phoneNumber: row.phoneNumber ?? "",
    note: row.note ?? null,
    status,
    statusLabel: allowed ? labels.recipientStatusAllowed : labels.recipientStatusPending,
    statusBadgeStatus: allowed ? "completed" : "pending",
    lastCheckedText: row.lastCheckedAt
      ? withVar(labels.recipientLastChecked, "date", formatTimestamp(row.lastCheckedAt))
      : null,
    errorText: row.lastErrorCode ? withVar(labels.recipientErrorCode, "code", row.lastErrorCode) : null,
  };
}

/** Cache of `Intl.RelativeTimeFormat` instances keyed by locale tag to avoid CPU and GC overhead in view-model renders. */
const relativeTimeFormatCache = new Map<string, Intl.RelativeTimeFormat>();

function getRelativeTimeFormat(locale: string): Intl.RelativeTimeFormat {
  const lang = locale === "ar" ? "ar" : "en";
  let formatter = relativeTimeFormatCache.get(lang);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(lang, { numeric: "always" });
    relativeTimeFormatCache.set(lang, formatter);
  }
  return formatter;
}

export function formatWindowRemaining(remainingMs: number, locale: string): string {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  const formatter = getRelativeTimeFormat(locale);
  if (totalMinutes >= 60) {
    return formatter.format(Math.ceil(totalMinutes / 60), "hour");
  }
  return formatter.format(totalMinutes, "minute");
}

export function toComposerProps(composer: ComposerState) {
  return {
    composerMode: composer.mode,
    onComposerModeChange: composer.onModeChange,
    textBody: composer.textBody,
    onTextBodyChange: composer.setTextBody,
    templateName: composer.templateName,
    onTemplateNameChange: composer.setTemplateName,
    templateLanguage: composer.templateLanguage,
    onTemplateLanguageChange: composer.setTemplateLanguage,
    recipientSelection: composer.recipientSelection,
    onRecipientSelectionChange: composer.setRecipientSelection,
    customRecipient: composer.customRecipient,
    onCustomRecipientChange: composer.setCustomRecipient,
    sendError: composer.sendError,
  };
}

export function toRegistryDialogProps(dialogs: RecipientDialogsState) {
  return {
    recipientsNotice: dialogs.notice,
    addRecipientOpen: dialogs.addOpen,
    addRecipientPhone: dialogs.addPhone,
    addRecipientNote: dialogs.addNote,
    addRecipientError: dialogs.addError,
    removeDialogRecipient: dialogs.removeTarget,
    verifyingRecipientId: dialogs.verifyingId,
    onOpenAddRecipient: dialogs.openAdd,
    onCloseAddRecipient: dialogs.closeAdd,
    onAddRecipientPhoneChange: dialogs.setAddPhone,
    onAddRecipientNoteChange: dialogs.setAddNote,
  };
}
