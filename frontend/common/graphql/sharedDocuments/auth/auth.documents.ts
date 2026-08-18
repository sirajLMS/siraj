import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { UserFieldsFragmentDoc } from "@/frontend/common/graphql/sharedDocuments/users/userFields.documents";

export const meQueryDocument: TypedDocumentNode<Operations.MeQuery> = gql`
  ${UserFieldsFragmentDoc}
  query me {
    me {
      ...UserFields
    }
  }
`;

export const userQueryDocument: TypedDocumentNode<Operations.UserQuery, Types.QueryUserArgs> = gql`
  ${UserFieldsFragmentDoc}
  query user($id: String!) {
    user(id: $id) {
      ...UserFields
    }
  }
`;

export const usersQueryDocument: TypedDocumentNode<Operations.UsersQuery, Types.QueryUsersArgs> = gql`
  ${UserFieldsFragmentDoc}
  query users($search: String, $limit: Int, $offset: Int) {
    users(search: $search, limit: $limit, offset: $offset) {
      ...UserFields
    }
  }
`;

export const loginMutationDocument: TypedDocumentNode<Operations.LoginMutation, Types.MutationLoginArgs> = gql`
  ${UserFieldsFragmentDoc}
  mutation login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
`;

export const demoLoginMutationDocument: TypedDocumentNode<Operations.DemoLoginMutation, Types.MutationDemoLoginArgs> =
  gql`
    ${UserFieldsFragmentDoc}
    mutation demoLogin($input: DemoLoginInput!) {
      demoLogin(input: $input) {
        token
        user {
          ...UserFields
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
  ${UserFieldsFragmentDoc}
  mutation refreshToken {
    refreshToken {
      token
      user {
        ...UserFields
      }
    }
  }
`;

export const impersonationStatusQueryDocument: TypedDocumentNode<Operations.ImpersonationStatusQuery> = gql`
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
  Operations.StartImpersonationMutation,
  Types.MutationStartImpersonationArgs
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
      id
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

export const changePasswordMutationDocument: TypedDocumentNode<
  Operations.ChangePasswordMutation,
  Types.MutationChangePasswordArgs
> = gql`
  mutation changePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

export const adminResetPasswordMutationDocument: TypedDocumentNode<
  Operations.AdminResetPasswordMutation,
  Types.MutationAdminResetPasswordArgs
> = gql`
  mutation adminResetPassword($input: AdminResetPasswordInput!) {
    adminResetPassword(input: $input) {
      success
      userId
      message
    }
  }
`;
