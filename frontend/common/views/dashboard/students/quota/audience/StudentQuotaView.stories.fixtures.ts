import {
  quotaLedgerQueryDocument,
  studentQuotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { setQuotaAudienceStoryUser } from "@/frontend/common/views/dashboard/students/quota/audience/quotaAudience.stories.helpers";

export function setStudentUser(): void {
  setQuotaAudienceStoryUser({
    id: "stu-001",
    name: "Test Student",
    role: "STUDENT",
    permissions: [],
  });
}

const ledgerPagination = {
  after: null,
  before: null,
  first: 5,
  last: null,
  maxCount: null,
  page: null,
  skip: 0,
};

const mockQuotas = [
  {
    __typename: "Quota" as const,
    id: "stu-quota-001",
    studentId: "stu-001",
    name: "Hifz Package — 20 Classes",
    kind: "PACKAGE",
    totalClasses: 20,
    remaining: 14,
    reservedClasses: 0,
    validFrom: "2025-01-01T00:00:00.000Z",
    validUntil: "2026-01-01T00:00:00.000Z",
    status: "ACTIVE",
    periodType: null,
    periodDays: null,
    priority: 10,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
];

const exhaustedQuotas = [
  {
    __typename: "Quota" as const,
    id: "stu-quota-exh-001",
    studentId: "stu-001",
    name: "Exhausted Package — 10 Classes",
    kind: "PACKAGE",
    totalClasses: 10,
    remaining: 0,
    reservedClasses: 0,
    validFrom: "2025-01-01T00:00:00.000Z",
    validUntil: "2026-01-01T00:00:00.000Z",
    status: "ACTIVE",
    periodType: null,
    periodDays: null,
    priority: 5,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
];

const mockLedgerRows = [
  {
    __typename: "QuotaLedger" as const,
    id: "ledger-001",
    quotaId: "stu-quota-001",
    studentId: "stu-001",
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
    quotaId: "stu-quota-001",
    studentId: "stu-001",
    recurringScheduleId: "schedule-001",
    classInstanceId: "class-001",
    delta: -1,
    reason: "REDEEM",
    reasonNote: "Class redeemed",
    actorUserId: "teacher-001",
    createdAt: "2025-06-01T00:00:00.000Z",
  },
];

export const defaultMocks = [
  {
    request: { query: studentQuotasQueryDocument, variables: { studentId: "stu-001" } },
    result: { data: { studentQuotas: mockQuotas } },
  },
  {
    request: {
      query: quotaLedgerQueryDocument,
      variables: { quotaId: "stu-quota-001", pagination: ledgerPagination },
    },
    result: {
      data: {
        quotaLedger: {
          __typename: "QuotaPaginatedResult" as const,
          rows: mockLedgerRows,
          totalCount: 2,
        },
      },
    },
  },
];

export const emptyMocks = [
  {
    request: { query: studentQuotasQueryDocument, variables: { studentId: "stu-001" } },
    result: { data: { studentQuotas: [] } },
  },
];

export const exhaustedMocks = [
  {
    request: { query: studentQuotasQueryDocument, variables: { studentId: "stu-001" } },
    result: { data: { studentQuotas: exhaustedQuotas } },
  },
  {
    request: {
      query: quotaLedgerQueryDocument,
      variables: { quotaId: "stu-quota-exh-001", pagination: ledgerPagination },
    },
    result: {
      data: {
        quotaLedger: {
          __typename: "QuotaPaginatedResult" as const,
          rows: [],
          totalCount: 0,
        },
      },
    },
  },
];

export const errorMocks = [
  {
    request: { query: studentQuotasQueryDocument, variables: { studentId: "stu-001" } },
    error: new Error("Failed to load quotas"),
  },
];
