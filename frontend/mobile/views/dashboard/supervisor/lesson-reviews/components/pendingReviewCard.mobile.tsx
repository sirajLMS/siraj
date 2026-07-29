"use client";

import { AccessTimeOutlined, CancelOutlined, CheckCircleOutlined, RateReviewOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import { DateTimeTooltipDisplay } from "@/frontend/common/components/intl/DateTimeTooltipDisplay";
import { ClassProfileLink } from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLink";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import {
  ScheduleSessionCardMetaBar,
  ScheduleSessionCardPersonCell,
  type ScheduleSessionMetaStatItem,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout";
import {
  StyledScheduleSessionCardActions,
  StyledScheduleSessionCardHeader,
  StyledScheduleSessionCardHeaderMain,
  StyledScheduleSessionPeopleRow,
  StyledScheduleSessionTimeHighlight,
  StyledScheduleSessionTimeHighlightContent,
  StyledScheduleSessionTimeHighlightLabel,
  scheduleSessionCardContentSx,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.styles";
import type {
  PendingReviewRow,
  PendingReviewsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui";

function statusLabel(status: PendingReviewRow["status"], labels: PendingReviewsViewModel["labels"]): string {
  if (!status) return labels.statusLabels.PENDING_REVIEW;
  return labels.statusLabels[status] ?? labels.statusLabels.PENDING_REVIEW;
}

interface PendingReviewCardMobileProps {
  readonly row: PendingReviewRow;
  readonly labels: PendingReviewsViewModel["labels"];
  readonly approving: boolean;
  readonly onApprove: (id: string) => void;
  readonly onReject: (row: PendingReviewRow) => void;
  readonly onSelect: (row: PendingReviewRow) => void;
}

export function PendingReviewCardMobile({
  row,
  labels,
  approving,
  onApprove,
  onReject,
  onSelect,
}: Readonly<PendingReviewCardMobileProps>) {
  const locale = useAppLocale();

  const metaItems: ScheduleSessionMetaStatItem[] = [
    {
      label: labels.submittedAtColumn,
      value: <DateTimeTooltipDisplay value={row.submittedAt} locale={locale} tone="meta" />,
      tone: "default",
    },
    {
      label: labels.completionColumn,
      value: `${row.completionPercentage}%`,
      tone: "default",
    },
    {
      label: labels.attendanceColumn,
      value: row.attendanceEvaluation ?? "—",
      tone: "default",
    },
  ];

  return (
    <Box sx={scheduleSessionCardContentSx}>
      <StyledScheduleSessionCardHeader>
        <StyledScheduleSessionCardHeaderMain>
          <ClassProfileLink
            href={row.classInstanceId ? classHref(row.classInstanceId) : undefined}
            name={row.subjectName?.trim() || "—"}
            avatarUrl={row.classAvatarUrl}
            avatarSize={40}
            typographyVariant="titleLg"
            fontWeight={700}
          />

          <MobileStatusBadge
            category="classStatus"
            status={row.status ? row.status.toLowerCase() : "pending"}
            label={statusLabel(row.status, labels)}
            size="small"
          />
        </StyledScheduleSessionCardHeaderMain>

        <StyledScheduleSessionCardActions>
          <Tooltip title={labels.reviewButton}>
            <IconButton size="small" aria-label={labels.reviewButton} onClick={() => onSelect(row)}>
              <RateReviewOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={labels.approveButton}>
            <IconButton
              size="small"
              aria-label={labels.approveButton}
              onClick={() => onApprove(row.id)}
              disabled={approving}
              sx={theme => ({ color: theme.palette.primary.main })}
            >
              <CheckCircleOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={labels.rejectButton}>
            <IconButton
              size="small"
              aria-label={labels.rejectButton}
              onClick={() => onReject(row)}
              sx={theme => ({ color: theme.palette.error.main })}
            >
              <CancelOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </StyledScheduleSessionCardActions>
      </StyledScheduleSessionCardHeader>

      <StyledScheduleSessionTimeHighlight>
        <AccessTimeOutlined sx={theme => ({ fontSize: 18, color: theme.palette.onPrimaryContainer, flexShrink: 0 })} />
        <StyledScheduleSessionTimeHighlightContent>
          <StyledScheduleSessionTimeHighlightLabel variant="labelMd">
            {labels.lessonDateColumn}
          </StyledScheduleSessionTimeHighlightLabel>
          <DateTimeTooltipDisplay value={row.lessonDate} locale={locale} tone="highlight" />
        </StyledScheduleSessionTimeHighlightContent>
      </StyledScheduleSessionTimeHighlight>

      <ScheduleSessionCardMetaBar items={metaItems} />

      <StyledScheduleSessionPeopleRow>
        <ScheduleSessionCardPersonCell
          label={labels.teacherColumn}
          name={row.teacherName || row.teacherId}
          tone="teacher"
          href={profileHrefForTeacher({ teacherId: row.teacherId })}
          avatarUrl={row.teacherAvatarUrl}
        />
        <ScheduleSessionCardPersonCell
          label={labels.studentColumn}
          name={row.studentName || row.studentId}
          tone="student"
          href={row.studentId ? studentHref(row.studentId) : undefined}
          avatarUrl={row.studentAvatarUrl}
        />
      </StyledScheduleSessionPeopleRow>
    </Box>
  );
}
