import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const availableClassSlotsQueryDocument: TypedDocumentNode<
  Operations.AvailableClassSlotsQuery,
  Types.QueryAvailableClassSlotsArgs
> = gql`
  query AvailableClassSlots(
    $studentId: ID!
    $teacherId: ID!
    $startDate: DateTime!
    $endDate: DateTime!
    $durationMinutes: Int!
  ) {
    availableClassSlots(
      studentId: $studentId
      teacherId: $teacherId
      startDate: $startDate
      endDate: $endDate
      durationMinutes: $durationMinutes
    ) {
      startAt
      endAt
      isAvailable
    }
  }
`;
