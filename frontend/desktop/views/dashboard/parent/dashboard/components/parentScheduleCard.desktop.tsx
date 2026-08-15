"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { MeetingUrlCell } from "@/frontend/common/components/ui/display/meetingConfig";
import {
  ParentScheduleCardShared,
  type ParentScheduleCardSharedOptions,
} from "@/frontend/common/views/dashboard/parent/dashboard/components/__shared__/parentScheduleCardShared";
import type { ParentDashboardLabels } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardLabels";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import { DesktopPersonProfileLinkCell, DesktopStatusBadge } from "@/frontend/desktop/components/ui";

export interface ParentScheduleDesktopListItemProps {
  readonly row: ParentScheduleRow;
  readonly labels: ParentDashboardLabels;
}

function resolveMeetingUrlStatus(row: ParentScheduleRow): string | null {
  if (row.isFrozen) return "failed";
  if (!row.videoEnabled && !row.meetingJoinUrl) return null;
  if (row.meetingJoinUrl !== null && row.meetingJoinUrl !== undefined) return "generated";
  return "pending";
}

const DESKTOP_OPTIONS: ParentScheduleCardSharedOptions = {
  profileSectionSx: { minWidth: 0, spacing: 0.5 },
  renderContainer: (children, row) => (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        border: `1px solid ${row.isFrozen ? theme.palette.info.main : theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainerLowest,
        opacity: row.isFrozen ? 0.85 : 1,
      })}
    >
      {children}
    </Box>
  ),
  renderStatusBadge: (row, labels) => (
    <DesktopStatusBadge
      category={row.bookingStatus === "rescheduled" ? "trackingStatus" : "session"}
      status={row.bookingStatus === "rescheduled" ? "rescheduled" : "confirmed"}
      label={labels.bookingStatus[row.bookingStatus]}
    />
  ),
  renderProfileLinks: (row, _labels, studentProfileHref, teacherProfileHref, teacherLabel) => (
    <>
      <DesktopPersonProfileLinkCell
        href={studentProfileHref}
        name={row.studentName}
        avatarUrl={row.studentAvatarUrl}
        showAvatar
        avatarSize={40}
        fallbackInitial={row.studentInitials?.[0] ?? "?"}
        typographyVariant="bodyMd"
        fontWeight={700}
      />
      <DesktopPersonProfileLinkCell
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
    if (row.isFrozen) {
      result = frozenFallback;
    } else if (canJoin) {
      result = (
        <MeetingUrlCell
          meetingUrl={row.meetingJoinUrl}
          meetingUrlStatus={resolveMeetingUrlStatus(row)}
          joinLabel={labels.schedule.joinVideo}
          compact
        />
      );
    }
    return result;
  },
};

/**
 * Desktop schedule row rendered inline (the parent desktop view uses an
 * `AppDataGrid`-based grid in `ParentScheduleDataGrid.desktop`). This card
 * variant is exposed for the optional list/compact desktop layouts where a
 * row-level card is preferred over a DataGrid row. Frozen rows get an
 * inline-start accent border and a snowflake indicator.
 */
export function ParentScheduleCardDesktop({ row, labels }: Readonly<ParentScheduleDesktopListItemProps>): ReactNode {
  return <ParentScheduleCardShared row={row} labels={labels} options={DESKTOP_OPTIONS} />;
}
