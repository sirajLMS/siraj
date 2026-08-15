"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
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

const DESKTOP_OPTIONS: ParentScheduleCardSharedOptions = {
  profileSectionSx: { minWidth: 0, spacing: 0.5 },
  renderContainer: (children, row) => (
    <Box
      sx={theme => ({
        p: 2.5,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.outlineVariant}`,
        ...(row.isFrozen
          ? {
              borderInlineStartWidth: 4,
              borderInlineStartColor: theme.palette.info.main,
              opacity: 0.85,
            }
          : {}),
        "&:hover": {
          boxShadow: theme.palette.shadow.card,
        },
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
