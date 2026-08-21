import { gql, type TypedDocumentNode } from "@apollo/client";
import type { SupervisorDashboardQuery } from "@/frontend/common/graphql/generated/gql/graphql";

export const supervisorDashboardQueryDocument: TypedDocumentNode<SupervisorDashboardQuery> = gql`
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
