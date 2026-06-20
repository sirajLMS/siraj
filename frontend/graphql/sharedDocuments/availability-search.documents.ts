import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const searchTeacherAvailabilityQueryDocument: TypedDocumentNode<
  Operations.SearchTeacherAvailabilityQuery,
  Types.QuerySearchTeacherAvailabilityArgs
> = gql`
  query searchTeacherAvailability($input: AvailabilitySearchInput!) {
    searchTeacherAvailability(input: $input) {
      id
      totalGaps
      teachers {
        id
        name
        gender
        timezone
        gaps {
          id
          teacherId
          teacherName
          teacherGender
          dayOfWeek
          gapStartTime
          gapEndTime
          timezone
        }
      }
    }
  }
`;
