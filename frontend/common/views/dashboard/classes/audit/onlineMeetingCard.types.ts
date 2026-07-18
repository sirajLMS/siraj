// NEW FOR PLAN v5: Lifted online meeting card Props out of tier (specs.md §4.1 Class C).
import type { OnlineMeetingInfo } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingInfoLabels } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";

export interface BaseOnlineMeetingCardProps {
  readonly meetingInfo: OnlineMeetingInfo | null | undefined;
  readonly showJoin?: boolean;
}

// VARIANT JUSTIFICATION: extra field labels — desktop renders meeting title/labels from
// a localized labels prop passed by the Container, while mobile reads useAppTranslation() inline.
export interface OnlineMeetingCardDesktopProps extends BaseOnlineMeetingCardProps {
  readonly labels: MeetingInfoLabels;
}
