import type {
  QuotaKind,
  QuotaLedgerReason,
  QuotaPeriodType,
  QuotaStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface QuotaItem {
  id: string;
  studentId: string;
  name: string;
  kind: QuotaKind;
  totalClasses: number;
  remaining: number;
  reservedClasses: number;
  validFrom: string | null;
  validUntil: string | null;
  status: QuotaStatus;
  periodType: QuotaPeriodType | null;
  periodDays: number | null;
  priority: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuotaLedgerItem {
  id: string;
  quotaId: string;
  studentId: string;
  recurringScheduleId: string | null;
  classInstanceId: string | null;
  delta: number;
  reason: QuotaLedgerReason;
  reasonNote: string | null;
  actorUserId: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
}
