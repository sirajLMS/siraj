import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ExecuteDstBulkUpdateMutation,
  ExecuteDstBulkUpdateMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const executeDstBulkUpdateMutationDocument: TypedDocumentNode<
  ExecuteDstBulkUpdateMutation,
  ExecuteDstBulkUpdateMutationVariables
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
