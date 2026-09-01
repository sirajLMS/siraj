import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AssignPermissionGroupToUserMutation,
  AssignPermissionGroupToUserMutationVariables,
  BulkAssignUsersToGroupMutation,
  BulkAssignUsersToGroupMutationVariables,
  BulkRevokeUsersFromGroupMutation,
  BulkRevokeUsersFromGroupMutationVariables,
  CreatePermissionGroupMutation,
  CreatePermissionGroupMutationVariables,
  DeletePermissionGroupMutation,
  DeletePermissionGroupMutationVariables,
  PermissionGroupsQuery,
  PermissionsQuery,
  RevokePermissionGroupFromUserMutation,
  RevokePermissionGroupFromUserMutationVariables,
  UpdatePermissionGroupMutation,
  UpdatePermissionGroupMutationVariables,
  UpdateUserOverridesMutation,
  UpdateUserOverridesMutationVariables,
  UserOverridesQuery,
  UserOverridesQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const PERMISSION_FIELDS = gql`
  fragment PermissionFields on Permission {
    id
    key
    resource
    action
    description
    category
    isSystem
  }
`;

const PERMISSION_GROUP_FIELDS = gql`
  fragment PermissionGroupFields on PermissionGroup {
    id
    name
    slug
    description
    isSystem
    createdAt
    updatedAt
    permissionIds
  }
`;

const PERMISSION_GROUP_DETAIL_FIELDS = gql`
  fragment PermissionGroupDetailFields on PermissionGroup {
    id
    name
    slug
    description
    isSystem
    createdAt
    updatedAt
    permissionIds
    assignedUsers {
      id
      name
      email
    }
  }
`;

const USER_OVERRIDE_FIELDS = gql`
  fragment UserOverrideFields on UserOverride {
    id
    permissionId
    state
    assignedBy
  }
`;

export const permissionsQueryDocument: TypedDocumentNode<PermissionsQuery> = gql`
  ${PERMISSION_FIELDS}
  query permissions {
    permissions {
      ...PermissionFields
    }
  }
`;

export const permissionGroupsQueryDocument: TypedDocumentNode<PermissionGroupsQuery> = gql`
  ${PERMISSION_GROUP_FIELDS}
  query permissionGroups {
    permissionGroups {
      ...PermissionGroupFields
    }
  }
`;

export const userOverridesQueryDocument: TypedDocumentNode<UserOverridesQuery, UserOverridesQueryVariables> = gql`
  ${USER_OVERRIDE_FIELDS}
  query userOverrides($userId: String!) {
    userOverrides(userId: $userId) {
      ...UserOverrideFields
    }
  }
`;

export const createPermissionGroupMutationDocument: TypedDocumentNode<
  CreatePermissionGroupMutation,
  CreatePermissionGroupMutationVariables
> = gql`
  ${PERMISSION_GROUP_DETAIL_FIELDS}
  mutation createPermissionGroup($input: CreatePermissionGroupInput!) {
    createPermissionGroup(input: $input) {
      ...PermissionGroupDetailFields
    }
  }
`;

export const updatePermissionGroupMutationDocument: TypedDocumentNode<
  UpdatePermissionGroupMutation,
  UpdatePermissionGroupMutationVariables
> = gql`
  ${PERMISSION_GROUP_DETAIL_FIELDS}
  mutation updatePermissionGroup($input: UpdatePermissionGroupInput!) {
    updatePermissionGroup(input: $input) {
      ...PermissionGroupDetailFields
    }
  }
`;

export const deletePermissionGroupMutationDocument: TypedDocumentNode<
  DeletePermissionGroupMutation,
  DeletePermissionGroupMutationVariables
> = gql`
  mutation deletePermissionGroup($groupId: String!) {
    deletePermissionGroup(groupId: $groupId)
  }
`;

export const assignPermissionGroupToUserMutationDocument: TypedDocumentNode<
  AssignPermissionGroupToUserMutation,
  AssignPermissionGroupToUserMutationVariables
> = gql`
  mutation assignPermissionGroupToUser($input: AssignPermissionGroupToUserInput!) {
    assignPermissionGroupToUser(input: $input)
  }
`;

export const revokePermissionGroupFromUserMutationDocument: TypedDocumentNode<
  RevokePermissionGroupFromUserMutation,
  RevokePermissionGroupFromUserMutationVariables
> = gql`
  mutation revokePermissionGroupFromUser($input: RevokePermissionGroupFromUserInput!) {
    revokePermissionGroupFromUser(input: $input)
  }
`;

export const bulkAssignUsersToGroupMutationDocument: TypedDocumentNode<
  BulkAssignUsersToGroupMutation,
  BulkAssignUsersToGroupMutationVariables
> = gql`
  mutation bulkAssignUsersToGroup($groupId: String!, $userIds: [String!]!) {
    bulkAssignUsersToGroup(groupId: $groupId, userIds: $userIds)
  }
`;

export const bulkRevokeUsersFromGroupMutationDocument: TypedDocumentNode<
  BulkRevokeUsersFromGroupMutation,
  BulkRevokeUsersFromGroupMutationVariables
> = gql`
  mutation bulkRevokeUsersFromGroup($groupId: String!, $userIds: [String!]!) {
    bulkRevokeUsersFromGroup(groupId: $groupId, userIds: $userIds)
  }
`;

export const updateUserOverridesMutationDocument: TypedDocumentNode<
  UpdateUserOverridesMutation,
  UpdateUserOverridesMutationVariables
> = gql`
  mutation updateUserOverrides($userId: String!, $overrides: [UserOverrideInput!]!) {
    updateUserOverrides(userId: $userId, overrides: $overrides)
  }
`;
