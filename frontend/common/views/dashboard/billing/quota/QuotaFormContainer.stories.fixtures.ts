import type { MockLink } from "@apollo/client/testing";
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createQuotaMutationDocument,
  quotaQueryDocument,
  quotasQueryDocument,
  updateQuotaMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { useQuotaStore } from "@/frontend/common/stores/quotaStore";

const mockExistingQuota = {
  __typename: "Quota" as const,
  id: "quota-edit-001",
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

export const createMocks: MockLink.MockedResponse[] = [
  {
    request: {
      query: createQuotaMutationDocument,
      variables: {
        input: {
          studentId: "",
          kind: "PACKAGE",
          name: "",
          totalClasses: 10,
          validFrom: null,
          validUntil: null,
          periodType: null,
          periodDays: null,
          priority: 10,
          idempotencyKey: null,
          rolloverPolicy: null,
        },
      },
    },
    result: {
      data: {
        createQuota: {
          __typename: "Quota" as const,
          id: "quota-new-001",
          studentId: "student-001",
          name: "New Quota",
          kind: QuotaKind.Package,
          totalClasses: 10,
          remaining: 10,
          reservedClasses: 0,
          validFrom: null,
          validUntil: null,
          status: QuotaStatus.Active,
          periodType: null,
          periodDays: null,
          priority: 10,
          createdAt: "2025-08-01T00:00:00.000Z",
          updatedAt: "2025-08-01T00:00:00.000Z",
        },
      },
    },
  },
  {
    request: { query: quotasQueryDocument },
    result: { data: { quotas: { __typename: "QuotaPaginatedResult" as const, rows: [], totalCount: 0 } } },
  },
];

export const editMocks: MockLink.MockedResponse[] = [
  {
    request: { query: quotaQueryDocument, variables: { id: "quota-edit-001" } },
    result: { data: { quota: mockExistingQuota } },
  },
  {
    request: {
      query: updateQuotaMutationDocument,
      variables: {
        id: "quota-edit-001",
        input: {
          name: "Hifz Package — 20 Classes",
          validUntil: "2026-01-01T00:00:00.000Z",
          status: "ACTIVE",
          priority: 10,
        },
      },
    },
    result: { data: { updateQuota: mockExistingQuota } },
  },
  {
    request: { query: quotasQueryDocument },
    result: {
      data: { quotas: { __typename: "QuotaPaginatedResult" as const, rows: [mockExistingQuota], totalCount: 1 } },
    },
  },
];

export const noResponseMocks: MockLink.MockedResponse[] = [
  {
    request: { query: quotasQueryDocument },
    result: { data: { quotas: { __typename: "QuotaPaginatedResult" as const, rows: [], totalCount: 0 } } },
  },
];

export function resetQuotaFormStore(): void {
  useQuotaStore.setState({
    formData: {
      studentId: "",
      kind: QuotaKind.Package,
      name: "",
      totalClasses: 10,
      validFrom: null,
      validUntil: null,
      periodType: null,
      periodDays: null,
      priority: 10,
    },
    filterStatus: null,
    filterKind: null,
    searchQuery: "",
    page: 0,
    pageSize: 10,
  });
}
