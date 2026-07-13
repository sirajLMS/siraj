import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const changeParentLifecycleStatusMutationDocument: TypedDocumentNode<
  Operations.ChangeParentLifecycleStatusMutation,
  Types.MutationChangeParentLifecycleStatusArgs
> = gql`
  mutation ChangeParentLifecycleStatus($parentId: String!, $newStatus: ParentStatus!) {
    changeParentLifecycleStatus(parentId: $parentId, newStatus: $newStatus) {
      id
      lifecycleStatus
    }
  }
`;
