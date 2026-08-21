import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  SearchTeacherAvailabilityQuery,
  SearchTeacherAvailabilityQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const searchTeacherAvailabilityQueryDocument: TypedDocumentNode<
  SearchTeacherAvailabilityQuery,
  SearchTeacherAvailabilityQueryVariables
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
