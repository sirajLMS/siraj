import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

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
    assignedUsers {
      id
      name
      email
    }
  }
`;

const USER_OVERRIDE_FIELDS = gql`
  fragment UserOverrideFields on UserOverride {
    permissionId
    state
    assignedBy
  }
`;

export const permissionsQueryDocument: TypedDocumentNode<
  Operations.PermissionsQuery,
  never
> = gql`
  ${PERMISSION_FIELDS}
  query permissions {
    permissions {
      ...PermissionFields
    }
  }
`;

export const permissionGroupsQueryDocument: TypedDocumentNode<
  Operations.PermissionGroupsQuery,
  never
> = gql`
  ${PERMISSION_GROUP_FIELDS}
  query permissionGroups {
    permissionGroups {
      ...PermissionGroupFields
    }
  }
`;

export const permissionGroupQueryDocument: TypedDocumentNode<
  Operations.PermissionGroupQuery,
  Types.QueryPermissionGroupArgs
> = gql`
  ${PERMISSION_GROUP_FIELDS}
  query permissionGroup($id: String!) {
    permissionGroup(id: $id) {
      ...PermissionGroupFields
    }
  }
`;

export const userPermissionGroupsQueryDocument: TypedDocumentNode<
  Operations.UserPermissionGroupsQuery,
  Types.QueryUserPermissionGroupsArgs
> = gql`
  query userPermissionGroups($userId: String!) {
    userPermissionGroups(userId: $userId)
  }
`;

export const userOverridesQueryDocument: TypedDocumentNode<
  Operations.UserOverridesQuery,
  Types.QueryUserOverridesArgs
> = gql`
  ${USER_OVERRIDE_FIELDS}
  query userOverrides($userId: String!) {
    userOverrides(userId: $userId) {
      ...UserOverrideFields
    }
  }
`;

export const effectiveUserPermissionsQueryDocument: TypedDocumentNode<
  Operations.EffectiveUserPermissionsQuery,
  Types.QueryEffectiveUserPermissionsArgs
> = gql`
  query effectiveUserPermissions($userId: String!) {
    effectiveUserPermissions(userId: $userId)
  }
`;

export const createPermissionGroupMutationDocument: TypedDocumentNode<
  Operations.CreatePermissionGroupMutation,
  Types.MutationCreatePermissionGroupArgs
> = gql`
  ${PERMISSION_GROUP_FIELDS}
  mutation createPermissionGroup($input: CreatePermissionGroupInput!) {
    createPermissionGroup(input: $input) {
      ...PermissionGroupFields
    }
  }
`;

export const updatePermissionGroupMutationDocument: TypedDocumentNode<
  Operations.UpdatePermissionGroupMutation,
  Types.MutationUpdatePermissionGroupArgs
> = gql`
  ${PERMISSION_GROUP_FIELDS}
  mutation updatePermissionGroup($input: UpdatePermissionGroupInput!) {
    updatePermissionGroup(input: $input) {
      ...PermissionGroupFields
    }
  }
`;

export const deletePermissionGroupMutationDocument: TypedDocumentNode<
  Operations.DeletePermissionGroupMutation,
  Types.MutationDeletePermissionGroupArgs
> = gql`
  mutation deletePermissionGroup($groupId: String!) {
    deletePermissionGroup(groupId: $groupId)
  }
`;

export const assignPermissionGroupToUserMutationDocument: TypedDocumentNode<
  Operations.AssignPermissionGroupToUserMutation,
  Types.MutationAssignPermissionGroupToUserArgs
> = gql`
  mutation assignPermissionGroupToUser($input: AssignPermissionGroupToUserInput!) {
    assignPermissionGroupToUser(input: $input)
  }
`;

export const revokePermissionGroupFromUserMutationDocument: TypedDocumentNode<
  Operations.RevokePermissionGroupFromUserMutation,
  Types.MutationRevokePermissionGroupFromUserArgs
> = gql`
  mutation revokePermissionGroupFromUser($input: RevokePermissionGroupFromUserInput!) {
    revokePermissionGroupFromUser(input: $input)
  }
`;

export const bulkAssignUsersToGroupMutationDocument: TypedDocumentNode<
  Operations.BulkAssignUsersToGroupMutation,
  Types.MutationBulkAssignUsersToGroupArgs
> = gql`
  mutation bulkAssignUsersToGroup($groupId: String!, $userIds: [String!]!) {
    bulkAssignUsersToGroup(groupId: $groupId, userIds: $userIds)
  }
`;

export const bulkRevokeUsersFromGroupMutationDocument: TypedDocumentNode<
  Operations.BulkRevokeUsersFromGroupMutation,
  Types.MutationBulkRevokeUsersFromGroupArgs
> = gql`
  mutation bulkRevokeUsersFromGroup($groupId: String!, $userIds: [String!]!) {
    bulkRevokeUsersFromGroup(groupId: $groupId, userIds: $userIds)
  }
`;

export const updateUserOverridesMutationDocument: TypedDocumentNode<
  Operations.UpdateUserOverridesMutation,
  Types.MutationUpdateUserOverridesArgs
> = gql`
  mutation updateUserOverrides($userId: String!, $overrides: [UserOverrideInput!]!) {
    updateUserOverrides(userId: $userId, overrides: $overrides)
  }
`;
