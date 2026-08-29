import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  RecordCreditAdjustmentMutation,
  RecordCreditAdjustmentMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const recordCreditAdjustmentMutationDocument: TypedDocumentNode<
  RecordCreditAdjustmentMutation,
  RecordCreditAdjustmentMutationVariables
> = gql`
  mutation RecordCreditAdjustment($input: CreditAdjustmentInput!) {
    recordCreditAdjustment(input: $input) {
      id
      studentId
      changeAmount
      changeAmountHours
      reason
      adjustmentType
      carryoverTeacherId
      carryoverFromDate
      carryoverToDate
      carryoverPaymentDate
      notes
      creditedByUserId
      createdAt
      updatedAt
    }
  }
`;
