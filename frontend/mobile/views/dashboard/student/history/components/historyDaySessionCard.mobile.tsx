"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { formatTime } from "@/frontend/common/components/intl/dateFormat";
import { ClassProfileLink } from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLink";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import {
  mapStudentHistoryStatusToBadge,
  resolveStudentHistoryStatusLabel,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistorySessionPresentation";
import { MobilePersonProfileLinkCell, MobileStatusBadge } from "@/frontend/mobile/components/ui";

export interface HistoryDaySessionCardMobileProps {
  readonly row: StudentHistorySessionRow;
  readonly labels: StudentHistoryViewModel["labels"];
  readonly locale: string;
}

function formatSessionTime(time: string, locale: string): string {
  if (!time) return "—";
  try {
    return formatTime(time, locale);
  } catch {
    return time;
  }
}

export function HistoryDaySessionCardMobile({ row, labels, locale }: Readonly<HistoryDaySessionCardMobileProps>) {
  const badgeStatus = mapStudentHistoryStatusToBadge(row.status, row.outcome);
  const statusLabel = resolveStudentHistoryStatusLabel(row, labels.statusLabels);
  const instructorName = row.instructor?.trim() || "—";
  const timeLabel = formatSessionTime(row.time, locale);

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1 }}>
        <ClassProfileLink
          href={classHref(row.id)}
          name={row.title?.trim() || "—"}
          avatarSize={36}
          typographyVariant="titleLg"
          fontWeight={700}
        />
        <Box sx={{ flexShrink: 0, maxWidth: "45%" }}>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, mb: 0.5 })}>
            {labels.instructor}
          </Typography>
          <MobilePersonProfileLinkCell
            href={profileHrefForTeacher({ teacherId: row.teacherId })}
            name={instructorName}
            avatarSize={36}
            typographyVariant="labelMd"
            fontWeight={700}
          />
        </Box>
      </Stack>

      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        <MobileStatusBadge category="classStatus" status={badgeStatus} label={statusLabel} size="small" />
        <AccessTimeOutlined sx={theme => ({ fontSize: 16, color: theme.palette.onSurfaceVariant })} />
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {timeLabel}
        </Typography>
      </Stack>
    </Box>
  );
}
