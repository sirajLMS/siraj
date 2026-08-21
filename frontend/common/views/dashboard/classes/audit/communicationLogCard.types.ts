// NEW FOR PLAN v5: Lifted communication log card Props out of tier (specs.md §4.1 Class B).
import type { GroupClassAuditQuery_groupClassAudit_communications } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CommunicationLogLabels } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";

export interface CommunicationLogCardProps {
  readonly entries: readonly (GroupClassAuditQuery_groupClassAudit_communications | null)[] | null | undefined;
  readonly labels: CommunicationLogLabels;
  readonly onResend: () => void;
  readonly isResending: boolean;
}
