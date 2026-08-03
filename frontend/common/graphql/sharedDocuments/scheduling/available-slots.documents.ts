import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

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
` as TypedDocumentNode<Operations.AvailableClassSlotsQuery, Types.QueryAvailableClassSlotsArgs>;
