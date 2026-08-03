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
