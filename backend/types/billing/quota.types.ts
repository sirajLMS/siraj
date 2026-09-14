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
  | "version"
> & {
  kind: QuotaKind;
  status: QuotaStatus;
  periodType: QuotaPeriodType | null;
};

export type QuotaLedgerSelectType = typeof quotaLedger.$inferSelect;

export type QuotaLedgerReturnType = Omit<QuotaLedgerSelectType, "reason" | "updatedAt" | "idempotencyKey"> & {
  reason: QuotaLedgerReason;
};

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
