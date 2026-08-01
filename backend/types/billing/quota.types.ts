import type { quotaLedger, quotas } from "@/backend/db/schema";
import type { QuotaKind, QuotaLedgerReason, QuotaPeriodType, QuotaStatus } from "@/backend/enum";

export type QuotaSelectType = typeof quotas.$inferSelect;

// NOTE: QuotaReturnType mirrors frontend QuotaItem — keep in sync to prevent drift
export type QuotaReturnType = Omit<QuotaSelectType, "kind" | "status" | "periodType"> & {
  kind: QuotaKind;
  status: QuotaStatus;
  periodType: QuotaPeriodType | null;
};

export type QuotaLedgerSelectType = typeof quotaLedger.$inferSelect;

export type QuotaLedgerReturnType = Omit<QuotaLedgerSelectType, "reason"> & {
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

type DateOrString = string | Date;

export type QuotaRolloverPolicy = {
  maxRolloverPercent?: number | null;
  accumulationCap?: number | null;
};

export interface QuotaSubmitInput {
  studentId: string;
  kind: QuotaKind;
  name: string;
  totalClasses: number;
  periodType?: QuotaPeriodType | null;
  periodDays?: number | null;
  validFrom?: DateOrString | null;
  validUntil?: DateOrString | null;
  priority?: number | null;
  rolloverPolicy?: QuotaRolloverPolicy | null;

  idempotencyKey?: string | null;
}

export interface QuotaUpdateInput {
  name?: string | null;
  priority?: number | null;
  status?: QuotaStatus | null;
  validUntil?: DateOrString | null;
  version: number;
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

export interface QuotaPaginatedFilter {
  studentId?: string | null;
  status?: QuotaStatus | null;
  kind?: QuotaKind | null;
  search?: string | null;
}

export interface QuotaPaginatedResult {
  rows: QuotaReturnType[];
  totalCount: number;
}

export interface QuotaLedgerPaginatedResult {
  rows: QuotaLedgerReturnType[];
  totalCount: number;
}
