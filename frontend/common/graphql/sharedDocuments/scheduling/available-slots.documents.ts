import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AvailableClassSlotsQuery,
  AvailableClassSlotsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const availableClassSlotsQueryDocument = gql`
  query AvailableClassSlots($studentId: ID!, $date: DateTime!, $teacherId: ID, $durationMinutes: Int) {
    availableClassSlots(studentId: $studentId, date: $date, teacherId: $teacherId, durationMinutes: $durationMinutes) {
      id
      teacherId
      startAt
      endAt
      available
    }
  }
` as TypedDocumentNode<AvailableClassSlotsQuery, AvailableClassSlotsQueryVariables>;
