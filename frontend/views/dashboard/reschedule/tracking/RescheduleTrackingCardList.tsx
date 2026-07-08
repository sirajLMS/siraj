"use client";

import {
  CalendarTodayOutlined,
  PersonOffOutlined,
  ScheduleOutlined,
  SchoolOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Box, Card, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { PaginationControls, StatusBadge } from "@/frontend/components/ui";
import { LeaveRequestStatus, RescheduleDateLabel } from "@/frontend/graphql/generated/gql/graphql-types";
import { getTrackingStatusIcon, getTrackingStatusLabel } from "./tracking.helpers";
import type { RescheduleTrackingCardListProps, TrackingRow } from "./tracking.types";

const CardHeader = ({ row, onView }: { row: TrackingRow; onView: (id: string) => void }) => {
  const rowId = row.id ?? "";
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
      <Box>
        <Typography
          variant="bodyLg"
          sx={theme => ({
            fontFamily: '"Hanken Grotesk", sans-serif',
            fontWeight: 700,
            color: theme.palette.text.primary,
          })}
        >
          {row.teacherName ?? ""}
        </Typography>
        <Typography
          variant="labelMd"
          sx={theme => ({
            fontFamily: '"Inter", sans-serif',
            color: theme.palette.text.secondary,
            fontWeight: 500,
          })}
        >
          ID: {row.teacherId ?? ""}
        </Typography>
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
};

const CardBody = ({ row }: { row: TrackingRow }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
        <SchoolOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
        <Typography
          variant="bodyMd"
          sx={theme => ({
            fontFamily: '"Hanken Grotesk", sans-serif',
            color: theme.palette.text.secondary,
          })}
        >
          {row.studentName ?? ""}
        </Typography>
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
};

const CardFooter = ({
  row,
  labels,
  isLeave,
}: {
  row: TrackingRow;
  labels: RescheduleTrackingCardListProps["labels"];
  isLeave: boolean;
}) => {
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
          borderRadius: 6,
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

      <StatusBadge
        category="trackingStatus"
        status={row.status ?? LeaveRequestStatus.Pending}
        label={
          row.status === null
            ? ""
            : getTrackingStatusLabel(row.status ?? LeaveRequestStatus.Pending, { ...labels, filterAll: "" })
        }
        icon={
          row.status === null ? null : getTrackingStatusIcon(row.status ?? LeaveRequestStatus.Pending, { fontSize: 14 })
        }
      />
    </Box>
  );
};

function TrackingCard({
  row,
  labels,
  onView,
}: {
  readonly row: TrackingRow;
  readonly labels: RescheduleTrackingCardListProps["labels"];
  readonly onView: (id: string) => void;
}) {
  const isLeave = row.dateLabel === RescheduleDateLabel.LeaveRequest;

  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 3,
        border: `1px solid ${theme.palette.border.light}`,
        borderBottom: `3px solid ${isLeave ? theme.palette.error.main : theme.palette.primary.main}20`,
        overflow: "hidden",
        p: 2,
        position: "relative",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: theme.palette.shadow.cardHover,
        },
      })}
    >
      <CardHeader row={row} onView={onView} />
      <CardBody row={row} />
      <CardFooter row={row} labels={labels} isLeave={isLeave} />
    </Card>
  );
}

export function RescheduleTrackingCardList({
  rows,
  labels,
  onView,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: RescheduleTrackingCardListProps) {
  if (rows.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.noEntries}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {rows.map(row => (
        <TrackingCard key={row.id ?? ""} row={row} labels={labels} onView={onView} />
      ))}
      {totalCount !== undefined && onPageChange !== undefined && totalCount > 0 && (
        <PaginationControls
          page={page ?? 0}
          pageCount={Math.ceil(totalCount / (pageSize ?? 10))}
          rowCount={totalCount}
          pageSize={pageSize ?? 10}
          onPageChange={onPageChange}
        />
      )}
    </Box>
  );
}
