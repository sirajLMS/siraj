import type { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export function formatQuotaStatus(
  status: QuotaStatus | string,
  t: QuotaLabels
): { label: string; color: "success" | "warning" | "default" | "error" } {
  switch (status) {
    case "ACTIVE":
      return { label: t.statuses.ACTIVE, color: "success" };
    case "EXPIRED":
      return { label: t.statuses.EXPIRED, color: "error" };
    case "ARCHIVED":
      return { label: t.statuses.ARCHIVED, color: "default" };
    default:
      return { label: status, color: "default" };
  }
}

export function formatQuotaKind(kind: QuotaKind | string, t: QuotaLabels): string {
  switch (kind) {
    case "PACKAGE":
      return t.kinds.PACKAGE;
    case "PERIODIC":
      return t.kinds.PERIODIC;
    default:
      return kind;
  }
}

export function formatQuotaDate(dateStr: string | null, fallback = "—"): string {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}
