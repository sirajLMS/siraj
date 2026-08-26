import { gql, type TypedDocumentNode } from "@apollo/client";
import type { SupervisorDashboardQuery } from "@/frontend/common/graphql/generated/gql/graphql";

export const supervisorDashboardQueryDocument: TypedDocumentNode<SupervisorDashboardQuery> = gql`
  query supervisorDashboard {
    supervisorDashboard {
      id
      supervisorName
      pendingReviewCount
      pendingDuesSummary {
        id
        totalCount
        totalAmount
        currency
      }
      monthlySnapshot {
        id
        year
        month
        label
      }
    }
  }
`;
