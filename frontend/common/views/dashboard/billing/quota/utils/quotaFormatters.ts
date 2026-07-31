import { QuotaKind, QuotaPeriodType, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export function formatQuotaStatus(
  status: QuotaStatus | string,
  t: QuotaLabels
): { label: string; color: "success" | "warning" | "default" | "error" } {
  switch (status) {
    case QuotaStatus.Active:
    case "ACTIVE":
      return { label: t.statuses.ACTIVE, color: "success" };
    case QuotaStatus.Expired:
    case "EXPIRED":
      return { label: t.statuses.EXPIRED, color: "error" };
    case QuotaStatus.Archived:
    case "ARCHIVED":
      return { label: t.statuses.ARCHIVED, color: "default" };
    default:
      return { label: String(status), color: "default" };
  }
}

export function formatQuotaKind(kind: QuotaKind | string, t: QuotaLabels): string {
  switch (kind) {
    case QuotaKind.Package:
    case "PACKAGE":
      return t.kinds.PACKAGE;
    case QuotaKind.Periodic:
    case "PERIODIC":
      return t.kinds.PERIODIC;
    default:
      return String(kind);
  }
}

export function formatPeriodType(periodType: QuotaPeriodType | string | null, t: QuotaLabels): string {
  if (!periodType) return "-";
  switch (periodType) {
    case QuotaPeriodType.Weekly:
    case "WEEKLY":
      return t.periodTypes.WEEKLY;
    case QuotaPeriodType.Monthly:
    case "MONTHLY":
      return t.periodTypes.MONTHLY;
    case QuotaPeriodType.Custom:
    case "CUSTOM":
      return t.periodTypes.CUSTOM;
    default:
      return String(periodType);
  }
}

export function formatQuotaDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}
