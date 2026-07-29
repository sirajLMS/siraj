// NEW FOR PLAN v5: Lifted online meeting card Props out of tier (specs.md §4.1 Class C).
import type { OnlineMeetingInfo } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingInfoLabels } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";

export interface OnlineMeetingCardProps extends BaseOnlineMeetingCardProps {
  readonly labels: MeetingInfoLabels;
}

export interface BaseOnlineMeetingCardProps {
  readonly meetingInfo: OnlineMeetingInfo | null | undefined;
  readonly showJoin?: boolean;
}

/** @deprecated Use {@link OnlineMeetingCardProps} */
export type OnlineMeetingCardDesktopProps = OnlineMeetingCardProps;
