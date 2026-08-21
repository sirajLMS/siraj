import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ChangeParentLifecycleStatusMutation,
  ChangeParentLifecycleStatusMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const changeParentLifecycleStatusMutationDocument: TypedDocumentNode<
  ChangeParentLifecycleStatusMutation,
  ChangeParentLifecycleStatusMutationVariables
> = gql`
  mutation ChangeParentLifecycleStatus($parentId: String!, $newStatus: ParentStatus!) {
    changeParentLifecycleStatus(parentId: $parentId, newStatus: $newStatus) {
      id
      lifecycleStatus
    }
  }
`;
