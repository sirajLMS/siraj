import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { WhatsappTestRecipientStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type {
  WhatsappRecipientViewRow,
  WhatsappTestRecipientRow,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

export const RECIPIENT_LIMIT = 5;
export const TIMESTAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

export function interpolateVar(template: string, variable: string, value: string): string {
  return template.replaceAll(`{${variable}}`, value);
}

/** Strips PhoneInput's formatted value down to the E.164 digits the API expects. */
export function phoneDigitsOnly(raw: string): string {
  return raw.replaceAll(/\D/g, "");
}

export function isRecipientRow(row: { id: string | null }): row is WhatsappTestRecipientRow {
  return row.id !== null;
}

/** Maps one registry row to the pre-shaped view row the panel renders. */
export function toRecipientViewRow(
  row: WhatsappTestRecipientRow,
  labels: WhatsappConversationsLabels,
  formatTimestamp: (iso: string | null) => string
): WhatsappRecipientViewRow {
  const allowed = row.status === WhatsappTestRecipientStatus.Allowed;
  return {
    id: row.id,
    phoneNumber: row.phoneNumber ?? "",
    note: row.note ?? null,
    status: row.status ?? WhatsappTestRecipientStatus.Pending,
    statusLabel: allowed ? labels.recipientStatusAllowed : labels.recipientStatusPending,
    statusBadgeStatus: allowed ? "completed" : "pending",
    lastCheckedText: row.lastCheckedAt
      ? interpolateVar(labels.recipientLastChecked, "date", formatTimestamp(row.lastCheckedAt))
      : null,
    errorText: row.lastErrorCode ? interpolateVar(labels.recipientErrorCode, "code", row.lastErrorCode) : null,
  };
}

/**
 * Resolves a registry mutation rejection to user copy: dedicated errors-
 * namespace strings for known domain codes, else the server-localized message,
 * else the conversations-namespace fallback.
 */
export function describeRegistryError(error: unknown, errorLabels: ErrorsLabels, fallback: string): string {
  if (CombinedGraphQLErrors.is(error)) {
    const code: unknown = error.errors[0]?.extensions?.code;
    if (code === "WHATSAPP_RECIPIENT_LIMIT_REACHED") {
      return errorLabels.whatsappRecipientLimitReached;
    }
    if (code === "WHATSAPP_RECIPIENT_CONFLICT") {
      return errorLabels.whatsappRecipientConflict;
    }
    const serverMessage: unknown = error.errors[0]?.message;
    if (typeof serverMessage === "string" && serverMessage !== "") {
      return serverMessage;
    }
  }
  logger.warn("WhatsApp test-recipient action failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  return fallback;
}
