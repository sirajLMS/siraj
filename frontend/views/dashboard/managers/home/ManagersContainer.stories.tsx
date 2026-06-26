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
    phone: "+1-555-0100",
    skypeId: "admin.skype",
    status: "ACTIVE",
    roleSlug: "super_admin",
    roleName: "Super Admin",
  },
  {
    __typename: "ManagerDirectoryRow" as const,
    id: "user-staff-1",
    staffProfileId: "staff-2",
    name: "Staff Member",
    email: "staff@academy.com",
    phone: "+1-555-0200",
    skypeId: "staff.skype",
    status: "ACTIVE",
    roleSlug: "staff_default",
    roleName: "Staff Default",
  },
];

const managerDirectoryMocks = [
  {
    request: {
      query: managerDirectoryQueryDocument,
    },
    result: {
      data: {
        managerDirectory: MOCK_MANAGER_ROWS,
      },
    },
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
            request: { query: managerDirectoryQueryDocument },
            result: { data: { managerDirectory: [] } },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};
