import {
  isQuotaKind,
  isQuotaLedgerReason,
  isQuotaPeriodType,
  isQuotaStatus,
  type QuotaPeriodType,
} from "@/backend/enum";
import type { QuotaLedgerReturnType, QuotaLedgerSelectType, QuotaReturnType, QuotaSelectType } from "@/backend/types";

/**
 * Map a raw `QuotaSelectType` row to a `QuotaReturnType`, validating enum fields.
 * Throws if `kind` or `status` don't match their enum values.
 */
export function mapQuotaToReturnType(row: QuotaSelectType): QuotaReturnType {
  if (!isQuotaKind(row.kind)) {
    throw new Error(`Invalid QuotaKind value: ${row.kind}`);
  }
  if (!isQuotaStatus(row.status)) {
    throw new Error(`Invalid QuotaStatus value: ${row.status}`);
  }

  let periodType: QuotaPeriodType | null;
  if (row.periodType === null) {
    periodType = null;
  } else if (isQuotaPeriodType(row.periodType)) {
    periodType = row.periodType;
  } else {
    periodType = null;
  }

  return {
    ...row,
    kind: row.kind,
    status: row.status,
    periodType,
  };
}

/**
 * Map a raw `QuotaLedgerSelectType` row to a `QuotaLedgerReturnType`, validating enum fields.
 * Throws if `reason` doesn't match its enum value.
 */
export function mapQuotaLedgerToReturnType(row: QuotaLedgerSelectType): QuotaLedgerReturnType {
  if (!isQuotaLedgerReason(row.reason)) {
    throw new Error(`Invalid QuotaLedgerReason value: ${row.reason}`);
  }
  return {
    ...row,
    reason: row.reason,
  };
}
