import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const searchTeacherAvailabilityQueryDocument: TypedDocumentNode<
  Operations.SearchTeacherAvailabilityQuery,
  Types.QuerySearchTeacherAvailabilityArgs
> = gql`
  query searchTeacherAvailability($input: AvailabilitySearchInput!) {
    searchTeacherAvailability(input: $input) {
      id
      totalGaps
      totalCount
      pageInfo {
        count
        currentPage
        hasMorePages
        lastPage
        perPage
        total
      }
      teachers {
        id
        name
        gender
        timezone
        availableDaysCount
        gaps {
          id
          teacherId
          teacherName
          teacherGender
          dayOfWeek
          calendarDate
          gapStartTime
          gapEndTime
          timezone
        }
      }
    }
  }
`;
