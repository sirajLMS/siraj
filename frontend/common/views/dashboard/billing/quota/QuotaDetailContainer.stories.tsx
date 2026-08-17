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
  deleteQuotaMutationDocument,
  quotaLedgerQueryDocument,
  quotaQueryDocument,
  quotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { QuotaDetailContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaDetailContainer";

const QUOTA_PERMISSIONS = [AppPermission.QuotasManage, AppPermission.QuotasView];

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

const defaultMocks = [
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

const notFoundMocks = [
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

const errorMocks = [
  {
    request: { query: quotaQueryDocument, variables: { id: "quota-error" } },
    error: new Error("Failed to load quota"),
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
  title: "Views/dashboard/billing/quota/QuotaDetailContainer",
  component: QuotaDetailContainer,
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
} satisfies Meta<typeof QuotaDetailContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { quotaId: "quota-001" },
};

export const Loading: Story = {
  args: { quotaId: "quota-001" },
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

export const NotFound: Story = {
  args: { quotaId: "missing-quota" },
  decorators: [
    Story => {
      applyMockPerms(QUOTA_PERMISSIONS);
      return (
        <MockedProvider mocks={notFoundMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export const ErrorState: Story = {
  args: { quotaId: "quota-error" },
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
