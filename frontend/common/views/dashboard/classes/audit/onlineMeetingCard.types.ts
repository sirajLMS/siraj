// NEW FOR PLAN v5: Lifted online meeting card Props out of tier (specs.md §4.1 Class C).
import type { GroupClassAuditQuery_groupClassAudit_meetingInfo } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MeetingInfoLabels } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";

export interface OnlineMeetingCardProps extends BaseOnlineMeetingCardProps {
  readonly labels: MeetingInfoLabels;
}

interface BaseOnlineMeetingCardProps {
  readonly meetingInfo: GroupClassAuditQuery_groupClassAudit_meetingInfo | null | undefined;
  readonly showJoin?: boolean;
}
