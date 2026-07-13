import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const executeDstBulkUpdateMutationDocument: TypedDocumentNode<
  Operations.ExecuteDstBulkUpdateMutation,
  Types.MutationExecuteDstBulkUpdateArgs
> = gql`
  mutation executeDstBulkUpdate($offsetMinutes: Int!, $description: String!) {
    executeDstBulkUpdate(offsetMinutes: $offsetMinutes, description: $description) {
      id
      runId
      updated
      conflicts
      unchanged
      total
      status
      updatedSessions {
        id
        studentId
        teacherId
        studentName
        teacherName
        fromTime
        toTime
      }
      conflictGroups {
        id
        teacherName
        conflicts {
          id
          studentName
          message
        }
      }
      checkedEmptyItems {
        id
        studentName
        reason
      }
    }
  }
`;
