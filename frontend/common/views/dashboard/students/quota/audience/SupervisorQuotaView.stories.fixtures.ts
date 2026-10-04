import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { setQuotaAudienceStoryUser } from "@/frontend/common/views/dashboard/students/quota/audience/quotaAudience.stories.helpers";

export function setSupervisorUser(): void {
  setQuotaAudienceStoryUser({
    id: "sup-001",
    name: "Supervisor Admin",
    role: "SUPERVISOR",
    permissions: [AppPermission.QuotasManage],
  });
}

const supervisorPagination = {
  after: null,
  before: null,
  first: 50,
  last: null,
  maxCount: null,
  page: null,
  skip: 0,
};

const mockQuotaRows = [
  {
    __typename: "Quota" as const,
    id: "quota-001",
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
  {
    __typename: "Quota" as const,
    id: "quota-002",
    studentId: "stu-002",
    name: "Tajweed Periodic — Monthly",
    kind: "PERIODIC",
    totalClasses: 8,
    remaining: 3,
    reservedClasses: 0,
    validFrom: "2025-03-01T00:00:00.000Z",
    validUntil: "2025-12-31T00:00:00.000Z",
    status: "ACTIVE",
    periodType: "MONTHLY",
    periodDays: 30,
    priority: 5,
    createdAt: "2025-03-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
  {
    __typename: "Quota" as const,
    id: "quota-003",
    studentId: "stu-003",
    name: "Expired Package — 10 Classes",
    kind: "PACKAGE",
    totalClasses: 10,
    remaining: 2,
    reservedClasses: 0,
    validFrom: "2024-01-01T00:00:00.000Z",
    validUntil: "2025-01-01T00:00:00.000Z",
    status: "EXPIRED",
    periodType: null,
    periodDays: null,
    priority: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];

export const defaultMocks = [
  {
    request: {
      query: quotasQueryDocument,
      variables: { filter: null, pagination: supervisorPagination },
    },
    result: {
      data: {
        quotas: {
          __typename: "QuotaPaginatedResult" as const,
          rows: mockQuotaRows,
          totalCount: 3,
        },
      },
    },
  },
];

export const emptyMocks = [
  {
    request: {
      query: quotasQueryDocument,
      variables: { filter: null, pagination: supervisorPagination },
    },
    result: {
      data: {
        quotas: {
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
    request: {
      query: quotasQueryDocument,
      variables: { filter: null, pagination: supervisorPagination },
    },
    error: new Error("Failed to load quotas"),
  },
];
