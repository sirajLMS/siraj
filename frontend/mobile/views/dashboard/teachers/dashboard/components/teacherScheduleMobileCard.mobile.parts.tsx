"use client";

import { AccessTimeOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { formatDurationMinutes } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import { StyledTimeHighlight } from "@/frontend/common/views/dashboard/components/__shared__/timeHighlightShared.styles";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import {
  getStatusLabel,
  resolveTeacherStatusBadge,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/sessionStatusUtils";
import { MobileActionIconLink, MobilePersonProfileLink, MobileStatusBadge } from "@/frontend/mobile/components/ui";

export function CardHeader({
  row,
  labels,
  canActivate,
  isLive,
  studentHref: href,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly isLive: boolean;
  readonly studentHref?: string;
}) {
  const badge = resolveTeacherStatusBadge(row.status);
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {isLive && (
          <Typography
            sx={{ typography: "labelUppercase", color: theme => theme.palette.error.main, fontWeight: 700, mb: 0.5 }}
          >
            {labels.activeControls.liveNow}
          </Typography>
        )}
        <MobilePersonProfileLink
          href={href}
          name={row.studentName}
          showAvatar={false}
          typographyVariant="titleLg"
          fontWeight={700}
          emphasizeLink
        />
        {!canActivate || row.status === "pending" || row.status === "connecting" ? null : (
          <Box sx={{ mt: 0.75 }}>
            <MobileStatusBadge
              category={badge.category}
              status={badge.status}
              label={getStatusLabel(row.status, labels.status)}
              size="small"
            />
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
        <Tooltip title={labels.schedule.classId}>
          <MobileActionIconLink href={`/classes/${row.id}`} aria-label={labels.schedule.classId}>
            <VisibilityOutlined fontSize="small" />
          </MobileActionIconLink>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function TimeHighlight({
  row,
  labels,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
}) {
  const duration = formatDurationMinutes(row.durationMinutes);
  return (
    <StyledTimeHighlight>
      <AccessTimeOutlined sx={theme => ({ fontSize: 18, color: theme.palette.primary.main, flexShrink: 0 })} />
      <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.schedule.time}
        </Typography>
        <Typography
          sx={{
            typography: "bodyLg",
            color: theme => theme.palette.primary.main,
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.timeRange}
        </Typography>
      </Box>
      {duration ? (
        <Typography sx={{ typography: "bodyMd", fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>
          {duration}
        </Typography>
      ) : null}
    </StyledTimeHighlight>
  );
}

export function StudentInfoRow({ row }: { readonly row: TeacherScheduleRow }) {
  const href = row.studentId ? studentHref(row.studentId) : undefined;

  return (
    <Box
      sx={theme => ({
        py: 1,
        mb: 1.5,
        borderTop: `1px solid ${theme.palette.border.light}`,
      })}
    >
      <MobilePersonProfileLink
        href={href}
        name={row.studentName}
        showAvatar
        avatarSize={32}
        fallbackInitial={row.studentInitials?.[0] ?? "?"}
        typographyVariant="bodyMd"
        fontWeight={400}
      />
    </Box>
  );
}
