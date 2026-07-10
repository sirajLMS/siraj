import { MockedProvider } from "@apollo/client/testing/react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import {
  impersonationStatusQueryDocument,
  permissionGroupSimulationStatusQueryDocument,
  simulatablePermissionGroupsQueryDocument,
} from "@/frontend/graphql/sharedDocuments/auth.documents";
import { useUserStore } from "@/frontend/stores/userStore";
import { UserMenuButton } from "@/frontend/views/dashboard/components/navbar/UserMenuButton";

const baseMocks = [
  {
    request: { query: impersonationStatusQueryDocument },
    result: { data: { impersonationStatus: { isActive: false } } },
  },
  {
    request: { query: permissionGroupSimulationStatusQueryDocument },
    result: {
      data: {
        permissionGroupSimulationStatus: {
          isActive: false,
          groupSlug: null,
          groupName: null,
          startedAt: null,
          expiresAt: null,
        },
      },
    },
  },
  {
    request: { query: simulatablePermissionGroupsQueryDocument },
    result: {
      data: {
        simulatablePermissionGroups: [
          { slug: "teacher", name: "Teacher", description: null },
          { slug: "parent", name: "Parent", description: null },
        ],
      },
    },
  },
];

const impersonatingMocks = [
  {
    request: { query: impersonationStatusQueryDocument },
    result: {
      data: {
        impersonationStatus: {
          isActive: true,
          startedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1_800_000).toISOString(),
          reason: null,
          targetUser: {
            id: "target-id",
            name: "Teacher User",
            email: "teacher@example.com",
            avatarUrl: null,
          },
          actorUser: {
            id: "actor-id",
            name: "Super Admin",
            email: "admin@example.com",
            avatarUrl: null,
          },
        },
      },
    },
  },
  {
    request: { query: permissionGroupSimulationStatusQueryDocument },
    result: { data: { permissionGroupSimulationStatus: { isActive: false } } },
  },
];

const simulatingMocks = [
  {
    request: { query: impersonationStatusQueryDocument },
    result: { data: { impersonationStatus: { isActive: false } } },
  },
  {
    request: { query: permissionGroupSimulationStatusQueryDocument },
    result: {
      data: {
        permissionGroupSimulationStatus: {
          isActive: true,
          groupSlug: "teacher",
          groupName: "Teacher",
          startedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1_800_000).toISOString(),
        },
      },
    },
  },
];

function StoryShell({ mocks, children }: Readonly<{ mocks: Array<Record<string, unknown>>; children: ReactNode }>) {
  useUserStore.setState({
    user: {
      id: "actor-id",
      name: "Super Admin",
      email: "admin@example.com",
      role: "SUPER_ADMIN",
      permissions: [],
      avatarUrl: "",
      notificationCount: 0,
      teacherId: null,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: null,
      displayCurrency: null,
      __typename: "User" as const,
    },
    name: "Super Admin",
    avatarUrl: "",
    permissions: [],
    notificationCount: 0,
    displayCurrency: null,
    actorIsSuperAdmin: true,
  });

  return <MockedProvider mocks={mocks as never}>{children}</MockedProvider>;
}

const meta: Meta<typeof UserMenuButton> = {
  title: "Dashboard/UserMenuButton",
  component: UserMenuButton,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof UserMenuButton>;

export const IdleSuperAdmin: Story = {
  render: () => (
    <StoryShell mocks={baseMocks}>
      <UserMenuButton userName="Super Admin" userEmail="admin@example.com" avatarUrl="" />
    </StoryShell>
  ),
};

export const Impersonating: Story = {
  render: () => (
    <StoryShell mocks={impersonatingMocks}>
      <UserMenuButton userName="Teacher User" userEmail="teacher@example.com" avatarUrl="" />
    </StoryShell>
  ),
};

export const SimulatingGroup: Story = {
  render: () => (
    <StoryShell mocks={simulatingMocks}>
      <UserMenuButton userName="Super Admin" userEmail="admin@example.com" avatarUrl="" />
    </StoryShell>
  ),
};
