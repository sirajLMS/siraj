import type { Quota, QuotaLedger } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type QuotaItem = Pick<
  Quota,
  | "id"
  | "studentId"
  | "name"
  | "kind"
  | "totalClasses"
  | "remaining"
  | "reservedClasses"
  | "validFrom"
  | "validUntil"
  | "status"
  | "periodType"
  | "periodDays"
  | "priority"
  | "createdAt"
  | "updatedAt"
>;

export type QuotaLedgerItem = Pick<
  QuotaLedger,
  | "id"
  | "quotaId"
  | "studentId"
  | "recurringScheduleId"
  | "classInstanceId"
  | "delta"
  | "reason"
  | "reasonNote"
  | "actorUserId"
  | "createdAt"
>;

export type {
  QuotaKind,
  QuotaLedgerReason,
  QuotaPeriodType,
  QuotaStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
