import type { MockLink } from "@apollo/client/testing";
import { AccountStatus, type MeQuery_me } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  impersonationStatusQueryDocument,
  permissionGroupSimulationStatusQueryDocument,
  simulatablePermissionGroupsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";

export const baseMocks: MockLink.MockedResponse[] = [
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

export const impersonatingMocks: MockLink.MockedResponse[] = [
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

export const simulatingMocks: MockLink.MockedResponse[] = [
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

/** Signed-in actor shared by every `UserMenuButton` story. */
export const superAdminStoryUser: MeQuery_me = {
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
  phone: null,
  status: AccountStatus.Activated,
  displayCurrency: null,
};
