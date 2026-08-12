"use client";

import type { ReactNode } from "react";
import {
  ParentScheduleCardShared,
  type ParentScheduleCardSharedOptions,
} from "@/frontend/common/views/dashboard/parent/dashboard/components/__shared__/parentScheduleCardShared";
import type { ParentDashboardLabels } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardLabels";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import { MobileCardListItem, MobilePersonProfileLink, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig/MeetingJoinAction.mobile";

export interface ParentScheduleMobileCardItemProps {
  readonly row: ParentScheduleRow;
  readonly labels: ParentDashboardLabels;
}

const MOBILE_OPTIONS: ParentScheduleCardSharedOptions = {
  profileSectionSx: { minWidth: 0, spacing: 0.25 },
  renderContainer: (children, _row) => children,
  renderStatusBadge: (row, labels) => (
    <MobileStatusBadge
      category={row.bookingStatus === "rescheduled" ? "trackingStatus" : "session"}
      status={row.bookingStatus === "rescheduled" ? "rescheduled" : "confirmed"}
      label={labels.bookingStatus[row.bookingStatus]}
    />
  ),
  renderProfileLinks: (row, _labels, studentProfileHref, teacherProfileHref, teacherLabel) => (
    <>
      <MobilePersonProfileLink
        href={studentProfileHref}
        name={row.studentName}
        avatarUrl={row.studentAvatarUrl}
        fallbackInitial={row.studentInitials || "S"}
        avatarSize={40}
        typographyVariant="bodyMd"
        fontWeight={700}
      />
      <MobilePersonProfileLink
        href={teacherProfileHref}
        name={teacherLabel}
        avatarSize={32}
        typographyVariant="labelMd"
        fontWeight={400}
        emphasizeLink={Boolean(teacherProfileHref)}
      />
    </>
  ),
  renderJoinAction: ({ row, labels, canJoin, frozenFallback }): ReactNode => {
    let result: ReactNode = null;
    if (canJoin) {
      result = (
        <MobileMeetingJoinAction
          variant="icon"
          joinUrl={row.meetingJoinUrl}
          meeting={row.effectiveMeeting}
          disabled={!row.videoEnabled}
          label={labels.schedule.joinVideo}
          emptyRole="parent"
        />
      );
    } else if (row.isFrozen) {
      result = frozenFallback;
    }
    return result;
  },
};

/**
 * Parent-schedule card rendered for each row via the `renderItem` callback
 * of `MobileCardList`. Uses the shared `MobileCardListItem` shell with
 * `edge-to-edge` variant and an inline-start accent border for frozen rows.
 */
export function ParentScheduleCardMobile({ row, labels }: Readonly<ParentScheduleMobileCardItemProps>): ReactNode {
  return (
    <MobileCardListItem
      variant="edge-to-edge"
      dimmed={row.isFrozen}
      accentBorder={row.isFrozen ? { color: "info", side: "inline-start" } : undefined}
    >
      <ParentScheduleCardShared row={row} labels={labels} options={MOBILE_OPTIONS} />
    </MobileCardListItem>
  );
}
