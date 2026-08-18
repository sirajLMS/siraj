"use client";

import {
  CalendarTodayOutlined,
  PersonOffOutlined,
  ScheduleOutlined,
  SchoolOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { LeaveRequestStatus, RescheduleDateLabel } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import {
  getTrackingStatusIcon,
  getTrackingStatusLabel,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import type {
  RescheduleTrackingCardListProps,
  TrackingRow,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { MobileCardList, MobileCardListItem, MobileEmptyState } from "@/frontend/mobile/components/ui";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";

function TrackingCardHeader({ row, onView }: Readonly<{ row: TrackingRow; onView: (id: string) => void }>) {
  const rowId = row.id ?? "";
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
      <Box>
        <MobilePersonProfileLink
          href={profileHrefForTeacher({ teacherId: row.teacherId })}
          name={row.teacherName ?? ""}
          typographyVariant="bodyLg"
          fontWeight={700}
        />
      </Box>
      <IconButton
        id={`view-card-${rowId}`}
        size="small"
        onClick={() => {
          onView(rowId);
        }}
        sx={theme => ({
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.primary.main,
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.07),
          },
        })}
      >
        <VisibilityOutlined fontSize="small" />
      </IconButton>
    </Box>
  );
}

function TrackingCardBody({ row }: Readonly<{ row: TrackingRow }>) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
        <SchoolOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
        <MobilePersonProfileLink
          href={row.studentId ? studentHref(row.studentId) : undefined}
          name={row.studentName ?? ""}
          showAvatar={false}
          typographyVariant="bodyMd"
        />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ScheduleOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
        <Typography
          variant="bodyMd"
          sx={theme => ({
            fontFamily: '"Hanken Grotesk", sans-serif',
            fontWeight: 600,
            color: theme.palette.text.primary,
          })}
        >
          {row.timeSlot}
        </Typography>
      </Box>
    </Box>
  );
}

function TrackingCardFooter({
  row,
  labels,
  isLeave,
}: Readonly<{
  row: TrackingRow;
  labels: RescheduleTrackingCardListProps["labels"];
  isLeave: boolean;
}>) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        pt: 1.5,
        borderTop: `1px solid ${theme.palette.border.light}`,
      })}
    >
      <Box
        sx={theme => ({
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          borderRadius: 8,
          backgroundColor: isLeave ? theme.palette.error.main : theme.palette.primary.main,
        })}
      >
        {isLeave ? (
          <PersonOffOutlined sx={theme => ({ fontSize: 14, color: theme.palette.onError })} />
        ) : (
          <CalendarTodayOutlined sx={theme => ({ fontSize: 14, color: theme.palette.onPrimary })} />
        )}
        <Typography
          variant="labelSm"
          sx={theme => ({
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: isLeave ? theme.palette.onError : theme.palette.onPrimary,
          })}
        >
          {isLeave ? labels.leaveRequest : `${labels.newDate}: ${row.scheduledDate}`}
        </Typography>
      </Box>

      {(() => {
        if (row.status === null) {
          return null;
        }
        const status = row.status ?? LeaveRequestStatus.Pending;
        return (
          <MobileStatusBadge
            category="trackingStatus"
            status={status}
            label={getTrackingStatusLabel(status, { ...labels, filterAll: "" })}
            icon={getTrackingStatusIcon(status, { fontSize: 14 })}
          />
        );
      })()}
    </Box>
  );
}

export function RescheduleTrackingCardListMobile({
  rows,
  labels,
  onView,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: RescheduleTrackingCardListProps) {
  if (rows.length === 0) {
    return <MobileEmptyState title={labels.noEntries} />;
  }

  return (
    <MobileCardList<TrackingRow>
      rows={[...rows]}
      getKey={row => row.id ?? ""}
      layout="rounded"
      gap={2}
      renderItem={row => {
        const isLeave = row.dateLabel === RescheduleDateLabel.LeaveRequest;
        return (
          <MobileCardListItem
            variant="rounded"
            accentBorder={{
              color: isLeave ? "error" : "primary",
              side: "bottom",
              width: 3,
            }}
          >
            <TrackingCardHeader row={row} onView={onView} />
            <TrackingCardBody row={row} />
            <TrackingCardFooter row={row} labels={labels} isLeave={isLeave} />
          </MobileCardListItem>
        );
      }}
      paginationOptions={
        totalCount !== undefined && onPageChange !== undefined
          ? buildServerPaginationOptions({
              page: page ?? 0,
              pageSize: pageSize ?? 10,
              totalCount,
              onPageChange,
            })
          : { mode: "client" }
      }
    />
  );
}
