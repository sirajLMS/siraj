import type { quotaLedger, quotas } from "@/backend/db/schema";
import type { QuotaKind, QuotaLedgerReason, QuotaPeriodType, QuotaStatus } from "@/backend/enum";

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

export function mapQuotaToReturnType(row: QuotaSelectType): QuotaReturnType {
  return {
    ...row,
    kind: row.kind as QuotaKind,
    status: row.status as QuotaStatus,
    periodType: row.periodType ? (row.periodType as QuotaPeriodType) : null,
  };
}

export function mapQuotaLedgerToReturnType(row: QuotaLedgerSelectType): QuotaLedgerReturnType {
  return {
    ...row,
    reason: row.reason as QuotaLedgerReason,
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
  version: number;
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
