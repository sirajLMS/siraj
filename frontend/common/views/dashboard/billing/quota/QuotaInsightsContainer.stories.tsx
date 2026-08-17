import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  AccountStatus,
  AppPermission,
  CurrencyCode,
  QuotaKind,
  QuotaStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { QuotaInsightsContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer";

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
  {
    __typename: "Quota" as const,
    id: "quota-004",
    studentId: "student-004",
    name: "Archived Package — 5 Classes",
    kind: QuotaKind.Package,
    totalClasses: 5,
    remaining: 0,
    reservedClasses: 0,
    validFrom: "2023-01-01T00:00:00.000Z",
    validUntil: "2023-06-01T00:00:00.000Z",
    status: QuotaStatus.Archived,
    periodType: null,
    periodDays: null,
    priority: 3,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-06-01T00:00:00.000Z",
  },
];

const defaultMocks = [
  {
    request: {
      query: quotasQueryDocument,
      variables: { filter: null, pagination: null },
    },
    result: {
      data: {
        quotas: {
          __typename: "QuotaPaginatedResult" as const,
          rows: mockQuotaRows,
          totalCount: 4,
        },
      },
    },
  },
];

const emptyMocks = [
  {
    request: {
      query: quotasQueryDocument,
      variables: { filter: null, pagination: null },
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
      variables: { filter: null, pagination: null },
    },
    error: new Error("Failed to load insights data"),
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

const meta = {
  title: "Views/dashboard/billing/quota/QuotaInsightsContainer",
  component: QuotaInsightsContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      applyMockPerms(QUOTA_PERMISSIONS);
      return (
        <MockedProvider mocks={defaultMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
} satisfies Meta<typeof QuotaInsightsContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  decorators: [
    Story => {
      applyMockPerms(QUOTA_PERMISSIONS);
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
      return (
        <MockedProvider mocks={errorMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
