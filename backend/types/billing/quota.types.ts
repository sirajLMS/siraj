import type { quotaLedger, quotas } from "@/backend/db/schema";
import type { QuotaKind, QuotaLedgerReason, QuotaPeriodType, QuotaStatus } from "@/backend/enum";

export type QuotaSelectType = typeof quotas.$inferSelect;
export type QuotaInsertType = typeof quotas.$inferInsert;

export type QuotaReturnType = Omit<
  QuotaSelectType,
  "kind" | "status" | "periodType" | "deletedAt" | "idempotencyKey" | "usedThisPeriod" | "periodAnchor"
> & {
  kind: QuotaKind;
  status: QuotaStatus;
  periodType: QuotaPeriodType | null;
};

export type QuotaLedgerSelectType = typeof quotaLedger.$inferSelect;
export type QuotaLedgerInsertType = typeof quotaLedger.$inferInsert;

export type QuotaLedgerReturnType = Omit<QuotaLedgerSelectType, "reason" | "updatedAt"> & {
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
};

export type QuotaUpdateType = {
  name?: string | null;
  priority?: number | null;
  status?: QuotaStatus | null;
  validUntil?: DateOrString | null;
  version: number;
};

export type QuotaLedgerInsertInput = Omit<QuotaLedgerInsertType, "createdAt" | "updatedAt">;

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
