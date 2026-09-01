import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AdminResetPasswordMutation,
  AdminResetPasswordMutationVariables,
  ChangePasswordMutation,
  ChangePasswordMutationVariables,
  DemoLoginMutation,
  DemoLoginMutationVariables,
  EndImpersonationMutation,
  EndPermissionGroupSimulationMutation,
  ImpersonationStatusQuery,
  LoginMutation,
  LoginMutationVariables,
  LogoutMutation,
  MeQuery,
  PermissionGroupSimulationStatusQuery,
  RefreshTokenMutation,
  SimulatablePermissionGroupsQuery,
  StartImpersonationMutation,
  StartImpersonationMutationVariables,
  StartPermissionGroupSimulationMutation,
  StartPermissionGroupSimulationMutationVariables,
  UserQuery,
  UserQueryVariables,
  UsersQuery,
  UsersQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { USER_FIELDS } from "@/frontend/common/graphql/sharedDocuments/users/user-fields.documents";

export const meQueryDocument: TypedDocumentNode<MeQuery> = gql`
  ${USER_FIELDS}
  query me {
    me {
      ...UserFields
    }
  }
`;

export const userQueryDocument: TypedDocumentNode<UserQuery, UserQueryVariables> = gql`
  ${USER_FIELDS}
  query user($id: String!) {
    user(id: $id) {
      ...UserFields
    }
  }
`;

export const usersQueryDocument: TypedDocumentNode<UsersQuery, UsersQueryVariables> = gql`
  ${USER_FIELDS}
  query users($search: String, $limit: Int, $offset: Int) {
    users(search: $search, limit: $limit, offset: $offset) {
      ...UserFields
    }
  }
`;

export const loginMutationDocument: TypedDocumentNode<LoginMutation, LoginMutationVariables> = gql`
  ${USER_FIELDS}
  mutation login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
`;

export const demoLoginMutationDocument: TypedDocumentNode<DemoLoginMutation, DemoLoginMutationVariables> = gql`
    ${USER_FIELDS}
    mutation demoLogin($input: DemoLoginInput!) {
      demoLogin(input: $input) {
        token
        user {
          ...UserFields
        }
      }
    }
  `;

export const logoutMutationDocument: TypedDocumentNode<LogoutMutation> = gql`
  mutation logout {
    logout
  }
`;

export const refreshTokenMutationDocument: TypedDocumentNode<RefreshTokenMutation> = gql`
  ${USER_FIELDS}
  mutation refreshToken {
    refreshToken {
      token
      user {
        ...UserFields
      }
    }
  }
`;

export const impersonationStatusQueryDocument: TypedDocumentNode<ImpersonationStatusQuery> = gql`
  query impersonationStatus {
    impersonationStatus {
      id
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
  StartImpersonationMutation,
  StartImpersonationMutationVariables
> = gql`
  mutation startImpersonation($targetUserId: String!, $reason: String) {
    startImpersonation(targetUserId: $targetUserId, reason: $reason) {
      id
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
        phone
        status
        displayCurrency
      }
    }
  }
`;

export const endImpersonationMutationDocument: TypedDocumentNode<EndImpersonationMutation> = gql`
  mutation endImpersonation {
    endImpersonation {
      token
    }
  }
`;

export const permissionGroupSimulationStatusQueryDocument: TypedDocumentNode<PermissionGroupSimulationStatusQuery> = gql`
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

export const simulatablePermissionGroupsQueryDocument: TypedDocumentNode<SimulatablePermissionGroupsQuery> = gql`
  query simulatablePermissionGroups {
    simulatablePermissionGroups {
      id
      slug
      name
      description
    }
  }
`;

export const startPermissionGroupSimulationMutationDocument: TypedDocumentNode<
  StartPermissionGroupSimulationMutation,
  StartPermissionGroupSimulationMutationVariables
> = gql`
  mutation startPermissionGroupSimulation($groupSlug: String!) {
    startPermissionGroupSimulation(groupSlug: $groupSlug) {
      token
      expiresAt
      groupSlug
    }
  }
`;

export const endPermissionGroupSimulationMutationDocument: TypedDocumentNode<EndPermissionGroupSimulationMutation> = gql`
  mutation endPermissionGroupSimulation {
    endPermissionGroupSimulation {
      token
    }
  }
`;

export const changePasswordMutationDocument: TypedDocumentNode<
  ChangePasswordMutation,
  ChangePasswordMutationVariables
> = gql`
  mutation changePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

export const adminResetPasswordMutationDocument: TypedDocumentNode<
  AdminResetPasswordMutation,
  AdminResetPasswordMutationVariables
> = gql`
  mutation adminResetPassword($input: AdminResetPasswordInput!) {
    adminResetPassword(input: $input) {
      success
      userId
      message
    }
  }
`;
