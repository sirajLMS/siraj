import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { managerDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/staff-directory.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { ManagersContainer } from "./ManagersContainer";

const MOCK_MANAGER_ROWS = [
  {
    __typename: "ManagerDirectoryRow" as const,
    id: "user-admin-1",
    staffProfileId: "staff-1",
    name: "Admin User",
    email: "admin@academy.com",
    avatarUrl: null,
    phone: "+1-555-0100",
    skypeId: "admin.skype",
    status: "ACTIVATED",
    roleSlug: "super_admin",
    roleName: "Super Admin",
  },
  {
    __typename: "ManagerDirectoryRow" as const,
    id: "user-staff-1",
    staffProfileId: "staff-2",
    name: "Staff Member",
    email: "staff@academy.com",
    avatarUrl: null,
    phone: "+1-555-0200",
    skypeId: "staff.skype",
    status: "ACTIVATED",
    roleSlug: "staff_default",
    roleName: "Staff",
  },
];

const MOCK_METRICS = {
  __typename: "ManagerDirectoryMetrics" as const,
  id: "manager-directory-metrics",
  totalAdmin: 1,
  systemStaff: 1,
  activeNow: 2,
  alerts: 0,
};

const MOCK_PAGE_INFO = {
  __typename: "PageInfo" as const,
  count: 2,
  currentPage: 1,
  firstItem: 1,
  hasMorePages: false,
  lastItem: 2,
  lastPage: 1,
  perPage: 10,
  total: 2,
};

function makeMockResult(rows: typeof MOCK_MANAGER_ROWS, metrics: typeof MOCK_METRICS) {
  return {
    data: {
      managerDirectory: {
        __typename: "ManagerDirectoryResult" as const,
        id: "manager-directory",
        rows,
        metrics,
        totalCount: rows.length,
        pageInfo: MOCK_PAGE_INFO,
      },
    },
  };
}

const defaultVariables = {
  paginationArgs: {
    first: 10,
    page: 1,
    skip: null,
    after: null,
    before: null,
    last: null,
    maxCount: null,
  },
  roleFilter: null,
  statusFilter: null,
};

const managerDirectoryMocks = [
  {
    request: {
      query: managerDirectoryQueryDocument,
      variables: defaultVariables,
    },
    result: makeMockResult(MOCK_MANAGER_ROWS, MOCK_METRICS),
  },
];

const meta: Meta<typeof ManagersContainer> = {
  title: "Views/dashboard/managers/home/ManagersContainer",
  component: ManagersContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      const perms = [
        AppPermission.StudentsList,
        AppPermission.StaffViewDirectory,
        AppPermission.ResourcesList,
        AppPermission.ResourcesUpload,
        AppPermission.StaffEditProfile,
      ];
      useUserStore.setState({ permissions: perms });
      return (
        <MockedProvider mocks={managerDirectoryMocks}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ManagersContainer>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  decorators: [
    Story => (
      <MockedProvider
        mocks={[
          {
            request: { query: managerDirectoryQueryDocument, variables: defaultVariables },
            result: {
              data: {
                managerDirectory: {
                  __typename: "ManagerDirectoryResult",
                  id: "manager-directory",
                  rows: [],
                  metrics: MOCK_METRICS,
                  totalCount: 0,
                  pageInfo: { ...MOCK_PAGE_INFO, count: 0, total: 0, firstItem: null, lastItem: null },
                },
              },
            },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};
