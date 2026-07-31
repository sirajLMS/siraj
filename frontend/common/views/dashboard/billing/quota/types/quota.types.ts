import type { QuotaKind, QuotaPeriodType, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";

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
  reason: string;
  reasonNote: string | null;
  actorUserId: string | null;
  createdAt: string;
}

export interface QuotaBalanceSummary {
  studentId: string;
  totalActiveClasses: number;
  totalRemaining: number;
  totalReserved: number;
  breakdownByExpiration: Array<{
    quotaId: string;
    quotaName: string;
    validUntil: string | null;
    remaining: number;
  }>;
}
