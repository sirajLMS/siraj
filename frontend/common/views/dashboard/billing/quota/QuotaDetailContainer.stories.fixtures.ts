import type { MockLink } from "@apollo/client/testing";
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  deleteQuotaMutationDocument,
  quotaLedgerQueryDocument,
  quotaQueryDocument,
  quotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";

const mockQuota = {
  __typename: "Quota" as const,
  id: "quota-001",
  studentId: "student-001",
  name: "Hifz Package — 20 Classes",
  kind: QuotaKind.Package,
  totalClasses: 20,
  remaining: 14,
  reservedClasses: 0,
  validFrom: "2025-01-01T00:00:00.000Z",
  validUntil: "2026-01-01T00:00:00.000Z",
  status: QuotaStatus.Active,
  periodType: null,
  periodDays: null,
  priority: 10,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-06-01T00:00:00.000Z",
};

const mockLedgerRows = [
  {
    __typename: "QuotaLedger" as const,
    id: "ledger-001",
    quotaId: "quota-001",
    studentId: "student-001",
    recurringScheduleId: null,
    classInstanceId: null,
    delta: 20,
    reason: "GRANT",
    reasonNote: "Initial purchase",
    actorUserId: "admin-001",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    __typename: "QuotaLedger" as const,
    id: "ledger-002",
    quotaId: "quota-001",
    studentId: "student-001",
    recurringScheduleId: "schedule-001",
    classInstanceId: "class-001",
    delta: -1,
    reason: "REDEEM",
    reasonNote: "Class redeemed",
    actorUserId: "teacher-001",
    createdAt: "2025-06-01T00:00:00.000Z",
  },
  {
    __typename: "QuotaLedger" as const,
    id: "ledger-003",
    quotaId: "quota-001",
    studentId: "student-001",
    recurringScheduleId: null,
    classInstanceId: null,
    delta: -5,
    reason: "ADJUST",
    reasonNote: "Manual adjustment",
    actorUserId: "admin-001",
    createdAt: "2025-07-01T00:00:00.000Z",
  },
];

const ledgerPagination = { after: null, before: null, first: 10, last: null, maxCount: null, page: 0, skip: 0 };

export const defaultMocks: MockLink.MockedResponse[] = [
  {
    request: { query: quotaQueryDocument, variables: { id: "quota-001" } },
    result: { data: { quota: mockQuota } },
  },
  {
    request: {
      query: quotaLedgerQueryDocument,
      variables: { quotaId: "quota-001", pagination: ledgerPagination },
    },
    result: {
      data: {
        quotaLedger: {
          __typename: "QuotaPaginatedResult" as const,
          rows: mockLedgerRows,
          totalCount: 3,
        },
      },
    },
  },
  {
    request: {
      query: quotasQueryDocument,
    },
    result: {
      data: {
        quotas: {
          __typename: "QuotaPaginatedResult" as const,
          rows: [mockQuota],
          totalCount: 1,
        },
      },
    },
  },
  {
    request: { query: deleteQuotaMutationDocument, variables: { id: "quota-001" } },
    result: {
      data: {
        deleteQuota: {
          __typename: "Quota" as const,
          id: "quota-001",
          studentId: "student-001",
          name: "Hifz Package — 20 Classes",
          kind: QuotaKind.Package,
          status: QuotaStatus.Archived,
        },
      },
    },
  },
];

export const notFoundMocks: MockLink.MockedResponse[] = [
  {
    request: { query: quotaQueryDocument, variables: { id: "missing-quota" } },
    result: { data: { quota: null } },
  },
  {
    request: {
      query: quotaLedgerQueryDocument,
      variables: { quotaId: "missing-quota", pagination: ledgerPagination },
    },
    result: { data: { quotaLedger: { __typename: "QuotaPaginatedResult" as const, rows: [], totalCount: 0 } } },
  },
];

export const errorMocks: MockLink.MockedResponse[] = [
  {
    request: { query: quotaQueryDocument, variables: { id: "quota-error" } },
    error: new Error("Failed to load quota"),
  },
];
