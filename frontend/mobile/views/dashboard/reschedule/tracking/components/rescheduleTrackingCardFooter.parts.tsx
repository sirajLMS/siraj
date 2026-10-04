"use client";

import { CalendarTodayOutlined, PersonOffOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  getTrackingStatusIcon,
  getTrackingStatusLabel,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import type {
  RescheduleTrackingCardListProps,
  TrackingRow,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";

export function TrackingCardFooter({
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
          borderRadius: theme.shape.borderRadius,
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
