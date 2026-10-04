"use client";

import { ScheduleOutlined, SchoolOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type {
  RescheduleTrackingCardListProps,
  TrackingRow,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";

export function TrackingCardHeader({
  row,
  onView,
  labels,
}: Readonly<{
  row: TrackingRow;
  onView: (id: string) => void;
  labels: RescheduleTrackingCardListProps["labels"];
}>) {
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
        aria-label={labels.viewDetails}
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

export function TrackingCardBody({ row }: Readonly<{ row: TrackingRow }>) {
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
