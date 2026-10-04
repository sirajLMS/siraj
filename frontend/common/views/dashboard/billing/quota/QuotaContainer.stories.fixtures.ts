import type { MockLink } from "@apollo/client/testing";
import { QuotaKind, QuotaStatus, type QuotasQuery_quotas_rows } from "@/frontend/common/graphql/generated/gql/graphql";
import { deleteQuotaMutationDocument, quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useQuotaStore } from "@/frontend/common/stores/quotaStore";

const QUOTA_ROW_DEFAULTS = { __typename: "Quota", periodType: null } as const;

type MockQuotaRow = typeof QUOTA_ROW_DEFAULTS & QuotasQuery_quotas_rows;

function quotaRow(overrides: Omit<MockQuotaRow, "__typename" | "periodType">): MockQuotaRow {
  return { ...QUOTA_ROW_DEFAULTS, ...overrides };
}

const mockQuotaRows = [
  quotaRow({
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
    periodDays: null,
    priority: 10,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  }),
  quotaRow({
    id: "quota-002",
    studentId: "student-002",
    name: "Monthly Periodic — 8 Classes",
    kind: QuotaKind.Periodic,
    totalClasses: 8,
    remaining: 3,
    reservedClasses: 1,
    validFrom: "2025-03-01T00:00:00.000Z",
    validUntil: "2025-09-01T00:00:00.000Z",
    status: QuotaStatus.Active,
    periodDays: 30,
    priority: 8,
    createdAt: "2025-03-01T00:00:00.000Z",
    updatedAt: "2025-06-15T00:00:00.000Z",
  }),
  quotaRow({
    id: "quota-003",
    studentId: "student-003",
    name: "Expired Package — 10 Classes",
    kind: QuotaKind.Package,
    totalClasses: 10,
    remaining: 0,
    reservedClasses: 0,
    validFrom: "2024-01-01T00:00:00.000Z",
    validUntil: "2024-06-01T00:00:00.000Z",
    status: QuotaStatus.Expired,
    periodDays: null,
    priority: 5,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-06-01T00:00:00.000Z",
  }),
];

const defaultPagination = { after: null, before: null, first: 10, last: null, maxCount: null, page: 0, skip: 0 };

export const defaultMocks: MockLink.MockedResponse[] = [
  {
    request: {
      query: quotasQueryDocument,
      variables: { filter: null, pagination: defaultPagination },
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
  {
    request: {
      query: deleteQuotaMutationDocument,
      variables: { id: "quota-001" },
    },
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

export const emptyMocks: MockLink.MockedResponse[] = [
  {
    request: {
      query: quotasQueryDocument,
      variables: { filter: null, pagination: defaultPagination },
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

export const errorMocks: MockLink.MockedResponse[] = [
  {
    request: {
      query: quotasQueryDocument,
      variables: { filter: null, pagination: defaultPagination },
    },
    error: new Error("Failed to load quotas"),
  },
];

export function resetQuotaStore(): void {
  useQuotaStore.setState({
    filterStatus: null,
    filterKind: null,
    searchQuery: "",
    page: 0,
    pageSize: 10,
  });
}
