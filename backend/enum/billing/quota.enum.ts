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

export function isQuotaKind(value: string): value is QuotaKind {
  return (Object.values(QuotaKind) as string[]).includes(value);
}

export function isQuotaStatus(value: string): value is QuotaStatus {
  return (Object.values(QuotaStatus) as string[]).includes(value);
}

export function isQuotaPeriodType(value: string): value is QuotaPeriodType {
  return (Object.values(QuotaPeriodType) as string[]).includes(value);
}

export function isQuotaLedgerReason(value: string): value is QuotaLedgerReason {
  return (Object.values(QuotaLedgerReason) as string[]).includes(value);
}
