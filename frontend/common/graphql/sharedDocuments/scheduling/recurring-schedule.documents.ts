import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  RecurringScheduleQuery,
  RecurringScheduleQueryVariables,
  RecurringSchedulesQuery,
  RecurringSchedulesQueryVariables,
  UpdateRecurringClassRateMutation,
  UpdateRecurringClassRateMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const recurringScheduleQueryDocument: TypedDocumentNode<
  RecurringScheduleQuery,
  RecurringScheduleQueryVariables
> = gql`
  query recurringSchedule($id: ID!) {
    recurringSchedule(id: $id) {
      id
      studentId
      studentName
      teacherId
      teacherName
      durationMinutes
      defaultStartTime
      timezone
      hourlyRate
      rateCurrency
      days {
        id
        dayOfWeek
        startTime
        isActive
      }
    }
  }
`;

export const recurringSchedulesQueryDocument: TypedDocumentNode<
  RecurringSchedulesQuery,
  RecurringSchedulesQueryVariables
> = gql`
  query recurringSchedules($pagination: PaginationArgs, $search: String) {
    recurringSchedules(pagination: $pagination, search: $search) {
      id
      rows {
        id
        studentId
        studentName
        teacherId
        teacherName
        durationMinutes
        defaultStartTime
        timezone
        hourlyRate
        rateCurrency
        createdAt
        updatedAt
      }
      totalCount
      pageInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

export const updateRecurringClassRateMutationDocument: TypedDocumentNode<
  UpdateRecurringClassRateMutation,
  UpdateRecurringClassRateMutationVariables
> = gql`
  mutation updateRecurringClassRate($input: UpdateRecurringClassRateInput!) {
    updateRecurringClassRate(input: $input) {
      id
      hourlyRate
      rateCurrency
    }
  }
`;
