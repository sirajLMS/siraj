import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const supervisorDashboardQueryDocument: TypedDocumentNode<Operations.SupervisorDashboardQuery> = gql`
  query supervisorDashboard {
    supervisorDashboard {
      supervisorName
      pendingReviewCount
      pendingDuesSummary {
        totalCount
        totalAmount
        currency
      }
      monthlySnapshot {
        year
        month
        label
      }
    }
  }
`;
