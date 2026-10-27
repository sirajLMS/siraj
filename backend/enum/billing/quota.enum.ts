export enum QuotaKind {
  PACKAGE = "PACKAGE",
  PERIODIC = "PERIODIC",
}

export enum QuotaStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  ARCHIVED = "ARCHIVED",
}

export enum QuotaPeriodType {
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  CUSTOM = "CUSTOM",
}

export enum QuotaLedgerReason {
  GRANT = "GRANT",
  RESERVE = "RESERVE",
  REDEEM = "REDEEM",
  RELEASE = "RELEASE",
  EXPIRE = "EXPIRE",
  ADJUST = "ADJUST",
}

// Module-level Set caches avoid repeated Object.values() array allocations
// and linear O(N) .includes() scans on every type guard check.
const QUOTA_KIND_SET = new Set<string>(Object.values(QuotaKind));
const QUOTA_STATUS_SET = new Set<string>(Object.values(QuotaStatus));
const QUOTA_PERIOD_TYPE_SET = new Set<string>(Object.values(QuotaPeriodType));
const QUOTA_LEDGER_REASON_SET = new Set<string>(Object.values(QuotaLedgerReason));

export function isQuotaKind(value: string): value is QuotaKind {
  return QUOTA_KIND_SET.has(value);
}

export function isQuotaStatus(value: string): value is QuotaStatus {
  return QUOTA_STATUS_SET.has(value);
}

export function isQuotaPeriodType(value: string): value is QuotaPeriodType {
  return QUOTA_PERIOD_TYPE_SET.has(value);
}

export function isQuotaLedgerReason(value: string): value is QuotaLedgerReason {
  return QUOTA_LEDGER_REASON_SET.has(value);
}
