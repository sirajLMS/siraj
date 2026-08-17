import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  AccountStatus,
  AppPermission,
  CurrencyCode,
  QuotaKind,
  QuotaStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  createQuotaMutationDocument,
  quotaQueryDocument,
  quotasQueryDocument,
  updateQuotaMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { useQuotaStore } from "@/frontend/common/stores/quotaStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { QuotaFormContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaFormContainer";

const QUOTA_PERMISSIONS = [AppPermission.QuotasManage, AppPermission.QuotasView];

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

const createMocks = [
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

const editMocks = [
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

const noResponseMocks = [
  {
    request: { query: quotasQueryDocument },
    result: { data: { quotas: { __typename: "QuotaPaginatedResult" as const, rows: [], totalCount: 0 } } },
  },
];

function applyMockPerms(perms: AppPermission[]) {
  useUserStore.setState({
    permissions: perms,
    user: {
      id: "mock-admin-001",
      name: "Admin User",
      role: "SUPERVISOR",
      avatarUrl: "",
      permissions: perms,
      notificationCount: 0,
      teacherId: null,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
      email: "[EMAIL_REDACTED]",
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
      __typename: "User",
    },
  });
}

function resetQuotaStore() {
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

const meta = {
  title: "Views/dashboard/billing/quota/QuotaFormContainer",
  component: QuotaFormContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      applyMockPerms(QUOTA_PERMISSIONS);
      resetQuotaStore();
      return (
        <MockedProvider mocks={createMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
} satisfies Meta<typeof QuotaFormContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Edit: Story = {
  args: { quotaId: "quota-edit-001" },
  decorators: [
    Story => {
      applyMockPerms(QUOTA_PERMISSIONS);
      resetQuotaStore();
      return (
        <MockedProvider mocks={editMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const ValidationErrors: Story = {
  args: {},
  decorators: [
    Story => {
      applyMockPerms(QUOTA_PERMISSIONS);
      resetQuotaStore();
      return (
        <MockedProvider mocks={noResponseMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
