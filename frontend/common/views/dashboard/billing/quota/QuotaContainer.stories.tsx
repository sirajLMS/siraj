import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  AccountStatus,
  AppPermission,
  CurrencyCode,
  QuotaKind,
  QuotaStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { deleteQuotaMutationDocument, quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useQuotaStore } from "@/frontend/common/stores/quotaStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { QuotaContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaContainer";

const QUOTA_PERMISSIONS = [AppPermission.QuotasManage, AppPermission.QuotasView];

const mockQuotaRows = [
  {
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
  },
  {
    __typename: "Quota" as const,
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
    periodType: null,
    periodDays: 30,
    priority: 8,
    createdAt: "2025-03-01T00:00:00.000Z",
    updatedAt: "2025-06-15T00:00:00.000Z",
  },
  {
    __typename: "Quota" as const,
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
    periodType: null,
    periodDays: null,
    priority: 5,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-06-01T00:00:00.000Z",
  },
];

const defaultPagination = { after: null, before: null, first: 10, last: null, maxCount: null, page: 0, skip: 0 };

const defaultMocks = [
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

const emptyMocks = [
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

const errorMocks = [
  {
    request: {
      query: quotasQueryDocument,
      variables: { filter: null, pagination: defaultPagination },
    },
    error: new Error("Failed to load quotas"),
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
    filterStatus: null,
    filterKind: null,
    searchQuery: "",
    page: 0,
    pageSize: 10,
  });
}

const meta = {
  title: "Views/dashboard/billing/quota/QuotaContainer",
  component: QuotaContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      applyMockPerms(QUOTA_PERMISSIONS);
      resetQuotaStore();
      return (
        <MockedProvider mocks={defaultMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
} satisfies Meta<typeof QuotaContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  decorators: [
    Story => {
      applyMockPerms(QUOTA_PERMISSIONS);
      resetQuotaStore();
      return (
        <MockedProvider mocks={[]}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const Empty: Story = {
  decorators: [
    Story => {
      applyMockPerms(QUOTA_PERMISSIONS);
      resetQuotaStore();
      return (
        <MockedProvider mocks={emptyMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const ErrorState: Story = {
  decorators: [
    Story => {
      applyMockPerms(QUOTA_PERMISSIONS);
      resetQuotaStore();
      return (
        <MockedProvider mocks={errorMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
