import type { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

export function getQuotaStatusLabel(status: QuotaStatus | string | null | undefined, t: StudentQuotaLabels): string {
  if (status == null) return t.common.notSet;
  switch (status) {
    case "ACTIVE":
      return t.audience.statuses.ACTIVE;
    case "EXPIRED":
      return t.audience.statuses.EXPIRED;
    case "ARCHIVED":
      return t.audience.statuses.ARCHIVED;
    default:
      return status;
  }
}

export function getQuotaKindLabel(kind: QuotaKind | string | null | undefined, t: StudentQuotaLabels): string {
  if (kind == null) return t.common.notSet;
  switch (kind) {
    case "PACKAGE":
      return t.audience.kinds.PACKAGE;
    case "PERIODIC":
      return t.audience.kinds.PERIODIC;
    default:
      return kind;
  }
}

export function getLedgerReasonLabel(reason: string | null | undefined, t: StudentQuotaLabels): string {
  if (reason == null) return t.common.notSet;
  switch (reason) {
    case "ADJUST":
      return t.audience.ledgerReasons.ADJUST;
    case "EXPIRE":
      return t.audience.ledgerReasons.EXPIRE;
    case "GRANT":
      return t.audience.ledgerReasons.GRANT;
    case "REDEEM":
      return t.audience.ledgerReasons.REDEEM;
    case "RELEASE":
      return t.audience.ledgerReasons.RELEASE;
    case "RESERVE":
      return t.audience.ledgerReasons.RESERVE;
    default:
      return reason;
  }
}
