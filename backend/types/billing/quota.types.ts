import type { quotaLedger, quotas } from "@/backend/db/schema";
import { QuotaKind, QuotaLedgerReason, QuotaPeriodType, QuotaStatus } from "@/backend/enum";

export type QuotaSelectType = typeof quotas.$inferSelect;
export type QuotaInsertType = typeof quotas.$inferInsert;

export type QuotaReturnType = Omit<
  QuotaSelectType,
  | "kind"
  | "status"
  | "periodType"
  | "deletedAt"
  | "idempotencyKey"
  | "usedThisPeriod"
  | "periodAnchor"
  | "rolloverPolicy"
  | "version"
> & {
  kind: QuotaKind;
  status: QuotaStatus;
  periodType: QuotaPeriodType | null;
};

export type QuotaLedgerSelectType = typeof quotaLedger.$inferSelect;
export type QuotaLedgerInsertType = typeof quotaLedger.$inferInsert;

export type QuotaLedgerReturnType = Omit<QuotaLedgerSelectType, "reason" | "updatedAt" | "idempotencyKey"> & {
  reason: QuotaLedgerReason;
};

/** Type guard: narrows string to QuotaKind by checking against enum values. */
const isQuotaKind = (value: string): value is QuotaKind =>
  (Object.values(QuotaKind) as readonly string[]).includes(value);

/** Type guard: narrows string to QuotaStatus by checking against enum values. */
const isQuotaStatus = (value: string): value is QuotaStatus =>
  (Object.values(QuotaStatus) as readonly string[]).includes(value);

/** Type guard: narrows string to QuotaPeriodType by checking against enum values. */
const isQuotaPeriodType = (value: string): value is QuotaPeriodType =>
  (Object.values(QuotaPeriodType) as readonly string[]).includes(value);

/** Type guard: narrows string to QuotaLedgerReason by checking against enum values. */
const isQuotaLedgerReason = (value: string): value is QuotaLedgerReason =>
  (Object.values(QuotaLedgerReason) as readonly string[]).includes(value);

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

export function mapQuotaLedgerToReturnType(row: QuotaLedgerSelectType): QuotaLedgerReturnType {
  if (!isQuotaLedgerReason(row.reason)) {
    throw new Error(`Invalid QuotaLedgerReason value: ${row.reason}`);
  }
  return {
    ...row,
    reason: row.reason,
  };
}

export type QuotaRolloverPolicy = {
  maxRolloverPercent?: number | null;
  accumulationCap?: number | null;
};

export type QuotaSubmitInput = Omit<
  QuotaInsertType,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "version"
  | "remaining"
  | "usedThisPeriod"
  | "reservedClasses"
  | "periodAnchor"
  | "status"
  | "validFrom"
  | "validUntil"
  | "priority"
  | "idempotencyKey"
> & {
  validFrom?: string | Date | null;
  validUntil?: string | Date | null;
  priority?: number | null;
  idempotencyKey?: string | null;
  rolloverPolicy?: QuotaRolloverPolicy | null;
  periodType?: QuotaPeriodType | null;
  periodDays?: number | null;
};

export type QuotaUpdateInput = Omit<
  Partial<
    Omit<
      QuotaInsertType,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "deletedAt"
      | "version"
      | "idempotencyKey"
      | "usedThisPeriod"
      | "periodAnchor"
      | "remaining"
      | "reservedClasses"
      | "totalClasses"
      | "studentId"
      | "kind"
      | "periodType"
      | "periodDays"
      | "rolloverPolicy"
    >
  >,
  "validUntil" | "validFrom"
> & {
  validUntil?: Date | null;
  validFrom?: Date | null;
  version?: number;
};

export type QuotaLedgerSubmitInput = Omit<QuotaLedgerInsertType, "createdAt" | "updatedAt">;

export interface QuotaPaginatedFilter {
  studentId?: string | null;
  status?: QuotaStatus | null;
  kind?: QuotaKind | null;
  search?: string | null;
}

export interface QuotaExpirationBreakdown {
  quotaId: string;
  quotaName: string;
  validUntil: Date | null;
  remaining: number;
}

export interface QuotaBalanceReturnType {
  studentId: string;
  totalActiveClasses: number;
  totalRemaining: number;
  totalReserved: number;
  breakdownByExpiration: QuotaExpirationBreakdown[];
}

export interface QuotaPaginatedResult {
  rows: QuotaReturnType[];
  totalCount: number;
}

export interface QuotaLedgerPaginatedResult {
  rows: QuotaLedgerReturnType[];
  totalCount: number;
}
