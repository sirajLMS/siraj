import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import { WhatsappMessageDirection } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappInboxLabels } from "@/shared/locale/types/whatsappInbox";

/** Reads the textual body out of a raw or Meta typed-content envelope. */
export function messageText(content: unknown): string | null {
  if (typeof content === "string") {
    return content.length > 0 ? content : null;
  }
  // Persisted rows carry the Meta typed-content envelope (e.g. `{ body, … }` or
  // an edit envelope `{ body, __edited_type }`) — read the textual body.
  if (typeof content === "object" && content !== null && "body" in content) {
    const body = content.body;
    return typeof body === "string" && body.length > 0 ? body : null;
  }
  return null;
}

/** Echo and API-outbound rows are rendered on the sender's side of the thread. */
export function isOutbound(direction: WhatsappMessageDirection | null): boolean {
  return direction === WhatsappMessageDirection.Echo || direction === WhatsappMessageDirection.ApiOutbound;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dayKey(sentAt: string | null): string | null {
  if (sentAt === null) {
    return null;
  }
  const date = new Date(sentAt);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const MEDIUM_DATE_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: "medium" };

export function dayDividerLabel(sentAt: string | null, labels: WhatsappInboxLabels, locale: string): string {
  if (sentAt === null) {
    return "";
  }
  const date = new Date(sentAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) {
    return labels.dayToday;
  }
  if (isSameDay(date, yesterday)) {
    return labels.dayYesterday;
  }
  return getDateTimeFormatter(locale === "ar" ? "ar" : "en", MEDIUM_DATE_OPTIONS).format(date);
}
