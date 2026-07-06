import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const meQueryDocument: TypedDocumentNode<Operations.MeQuery> = gql`
  query me {
    me {
      createdAt
      email
      emailVerifiedAt
      id
      name
      updatedAt
      permissions
      role
      avatarUrl
      notificationCount
      teacherId
      parentId
    }
  }
`;

export const userQueryDocument: TypedDocumentNode<Operations.UserQuery, Types.QueryUserArgs> = gql`
  query user($id: String!) {
    user(id: $id) {
      createdAt
      email
      emailVerifiedAt
      id
      name
      updatedAt
      permissions
      role
      avatarUrl
      notificationCount
      teacherId
      parentId
    }
  }
`;

export const usersQueryDocument: TypedDocumentNode<Operations.UsersQuery> = gql`
  query users {
    users {
      createdAt
      email
      emailVerifiedAt
      id
      name
      updatedAt
      permissions
      role
      avatarUrl
      notificationCount
      teacherId
      parentId
    }
  }
`;

export const loginMutationDocument: TypedDocumentNode<Operations.LoginMutation, Types.MutationLoginArgs> = gql`
  mutation login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        createdAt
        email
        emailVerifiedAt
        id
        name
        updatedAt
        permissions
        role
        avatarUrl
        notificationCount
      teacherId
      parentId
      }
    }
  }
`;

export const demoLoginMutationDocument: TypedDocumentNode<Operations.DemoLoginMutation, Types.MutationDemoLoginArgs> =
  gql`
  mutation demoLogin($input: DemoLoginInput!) {
    demoLogin(input: $input) {
      token
      user {
        createdAt
        email
        emailVerifiedAt
        id
        name
        updatedAt
        permissions
        role
        avatarUrl
        notificationCount
      teacherId
      parentId
      }
    }
  }
`;

export const logoutMutationDocument: TypedDocumentNode<Operations.LogoutMutation> = gql`
  mutation logout {
    logout
  }
`;

export const refreshTokenMutationDocument: TypedDocumentNode<Operations.RefreshTokenMutation> = gql`
  mutation refreshToken {
    refreshToken {
      token
      user {
        createdAt
        email
        emailVerifiedAt
        id
        name
        updatedAt
        permissions
        role
        avatarUrl
        notificationCount
      teacherId
      parentId
      }
    }
  }
`;

export const impersonationStatusQueryDocument: TypedDocumentNode<Operations.ImpersonationStatusQuery> = gql`
  query impersonationStatus {
    impersonationStatus {
      isActive
      startedAt
      expiresAt
      reason
      targetUser {
        id
        name
        email
      }
      actorUser {
        id
        name
        email
      }
    }
  }
`;

export const startImpersonationMutationDocument: TypedDocumentNode<
  Operations.StartImpersonationMutation,
  Types.MutationStartImpersonationArgs
> = gql`
  mutation startImpersonation($targetUserId: String!, $reason: String) {
    startImpersonation(targetUserId: $targetUserId, reason: $reason) {
      token
      expiresAt
      impersonationSessionId
      targetUser {
        id
        name
        email
        permissions
        role
        avatarUrl
        notificationCount
      teacherId
      parentId
      }
    }
  }
`;

export const endImpersonationMutationDocument: TypedDocumentNode<Operations.EndImpersonationMutation> = gql`
  mutation endImpersonation {
    endImpersonation {
      token
    }
  }
`;

export const permissionGroupSimulationStatusQueryDocument: TypedDocumentNode<Operations.PermissionGroupSimulationStatusQuery> = gql`
  query permissionGroupSimulationStatus {
    permissionGroupSimulationStatus {
      isActive
      groupSlug
      groupName
      startedAt
      expiresAt
    }
  }
`;

export const simulatablePermissionGroupsQueryDocument: TypedDocumentNode<Operations.SimulatablePermissionGroupsQuery> = gql`
  query simulatablePermissionGroups {
    simulatablePermissionGroups {
      slug
      name
      description
    }
  }
`;

export const startPermissionGroupSimulationMutationDocument: TypedDocumentNode<
  Operations.StartPermissionGroupSimulationMutation,
  Types.MutationStartPermissionGroupSimulationArgs
> = gql`
  mutation startPermissionGroupSimulation($groupSlug: String!) {
    startPermissionGroupSimulation(groupSlug: $groupSlug) {
      token
      expiresAt
      groupSlug
    }
  }
`;

export const endPermissionGroupSimulationMutationDocument: TypedDocumentNode<Operations.EndPermissionGroupSimulationMutation> = gql`
  mutation endPermissionGroupSimulation {
    endPermissionGroupSimulation {
      token
    }
  }
`;
