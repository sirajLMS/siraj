"use client";

import { EventRepeatOutlined, PersonOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { STATUS_LABEL_KEYS } from "@/frontend/common/views/dashboard/classes/status/tracking/constants/statusLabelKeys.constants";
import {
  type CardListLabels,
  computeSessionStatus,
  formatScheduleRange,
  SessionStatus,
  type StatusTrackingCardListProps,
  type StatusTrackingRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import {
  getStatusAvatarSx,
  getStatusIcon,
} from "@/frontend/common/views/dashboard/classes/status/tracking/utils/statusTrackingIcons.utils";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileContentInset, MobileSectionTitleRow } from "@/frontend/mobile/components/ui/container";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { MobileEmptyState } from "@/frontend/mobile/components/ui/state";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { useAppLocale } from "@/shared/locale";

const StyledCardActionButtonBase = styled(Button)(({ theme }) => ({
  fontFamily: theme.typography.labelUppercase.fontFamily,
  fontSize: theme.typography.labelMd.fontSize,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  paddingBlock: theme.spacing(1.25),
  borderRadius: 2,
  marginTop: theme.spacing(2),
}));

const StyledActivateActionButton = styled(StyledCardActionButtonBase)(({ theme }) => ({
  borderWidth: 2,
  color: theme.palette.primary.main,
  borderColor: theme.palette.primary.main,
  "&:hover": { borderWidth: 2 },
}));

const StyledStudentNameText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: theme.typography.bodyLg.fontSize,
  color: theme.palette.text.primary,
}));

const StyledClassNameText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.labelMd.fontSize,
  color: theme.palette.primary.main,
  fontWeight: 500,
}));

const StyledMetaInfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  color: theme.palette.text.secondary,
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.titleLg.fontSize,
  fontWeight: 700,
  color: theme.palette.primary.main,
  whiteSpace: "nowrap",
}));

const StyledSessionCount = styled(Box)(({ theme }) => ({
  display: "inline",
  color: theme.palette.text.secondary,
  fontWeight: 400,
  fontSize: theme.typography.bodyMd.fontSize,
  whiteSpace: "nowrap",
}));

const StyledStatusAvatar = styled(Box, {
  shouldForwardProp: prop => prop !== "avatarSx",
})<{ avatarSx: ReturnType<typeof getStatusAvatarSx> }>(({ theme, avatarSx }) => ({
  width: 48,
  height: 48,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: theme.typography.labelUppercase.fontFamily,
  fontSize: theme.typography.bodyMd.fontSize,
  fontWeight: 700,
  flexShrink: 0,
  border: `1px solid ${theme.palette.border.light}`,
  ...(typeof avatarSx === "function"
    ? (avatarSx as (t: typeof theme) => Record<string, unknown>)(theme)
    : (avatarSx as Record<string, unknown>)),
}));

function CardActionButton({
  row,
  sessionStatus,
  labels,
  onActivate,
  onReschedule,
  onVerify,
}: {
  readonly row: StatusTrackingRow;
  readonly sessionStatus: SessionStatus;
  readonly labels: CardListLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
}) {
  const rowId = row.id ?? "";

  if (sessionStatus === SessionStatus.REGULAR) {
    if (isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false })) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <MobileMeetingJoinAction
            variant="icon"
            joinUrl={row.meetingJoinUrl}
            meeting={row.effectiveMeeting}
            emptyRole="class"
            label={labels.joinSession}
            setupHref={`/classes/${rowId}#meeting-configs`}
            id={`mobile-join-${rowId}`}
          />
        </Box>
      );
    }
    return (
      <StyledCardActionButtonBase id={`mobile-session-ended-${rowId}`} fullWidth disabled>
        {labels.sessionEnded}
      </StyledCardActionButtonBase>
    );
  }

  if (sessionStatus === SessionStatus.SUSPENDED_PENDING) {
    return (
      <StyledActivateActionButton
        id={`mobile-activate-${rowId}`}
        fullWidth
        variant="outlined"
        onClick={() => {
          onActivate(rowId);
        }}
      >
        {labels.activate}
      </StyledActivateActionButton>
    );
  }

  if (sessionStatus === SessionStatus.ON_LEAVE) {
    return (
      <StyledActivateActionButton
        id={`mobile-reschedule-${rowId}`}
        fullWidth
        variant="outlined"
        startIcon={<EventRepeatOutlined />}
        onClick={() => {
          onReschedule(rowId);
        }}
      >
        {labels.reschedule}
      </StyledActivateActionButton>
    );
  }

  return (
    <StyledCardActionButtonBase
      id={`mobile-verify-${rowId}`}
      fullWidth
      variant="contained"
      onClick={() => {
        onVerify(rowId);
      }}
    >
      {labels.verifyDocuments}
    </StyledCardActionButtonBase>
  );
}

function StatusTrackingCard({
  row,
  labels,
  onActivate,
  onReschedule,
  onVerify,
}: {
  readonly row: StatusTrackingRow;
  readonly labels: CardListLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
}) {
  const locale = useAppLocale();
  const sessionStatus = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 0,
        border: `1px solid ${theme.palette.border.light}`,
        transition: "transform 0.15s ease",
        "&:active": { transform: "scale(0.98)" },
      })}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <StyledStatusAvatar avatarSx={getStatusAvatarSx(sessionStatus)}>
            {row.studentInitials ?? ""}
          </StyledStatusAvatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <StyledStudentNameText>{row.studentName ?? ""}</StyledStudentNameText>
                <StyledClassNameText>{row.teacherName ?? ""}</StyledClassNameText>
              </Box>
              <MobileStatusBadge
                category="sessionTracking"
                status={sessionStatus}
                label={labels[STATUS_LABEL_KEYS[sessionStatus]]}
                icon={getStatusIcon(sessionStatus)}
              />
            </Box>

            <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
              <StyledMetaInfoRow>
                <PersonOutlined sx={{ fontSize: 16 }} />
                <Typography sx={{ typography: "bodyMd" }}>{row.teacherName ?? ""}</Typography>
              </StyledMetaInfoRow>
              <StyledMetaInfoRow>
                <ScheduleOutlined sx={{ fontSize: 16 }} />
                <Typography sx={{ typography: "bodyMd" }}>
                  {formatScheduleRange(row.scheduledStartAt, row.scheduledEndAt, locale)}
                </Typography>
              </StyledMetaInfoRow>
            </Box>
          </Box>
        </Box>

        <CardActionButton
          row={row}
          sessionStatus={sessionStatus}
          labels={labels}
          onActivate={onActivate}
          onReschedule={onReschedule}
          onVerify={onVerify}
        />
      </CardContent>
    </Card>
  );
}

export function StatusTrackingCardList({
  rows,
  totalSessions,
  labels,
  onActivate,
  onReschedule,
  onVerify,
}: StatusTrackingCardListProps) {
  return (
    <Box>
      <MobileSectionTitleRow
        title={
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, minWidth: 0 }}>
            <StyledSectionTitle>{labels.todaysSchedule}</StyledSectionTitle>
            <StyledSessionCount>({totalSessions})</StyledSessionCount>
          </Box>
        }
      />

      {rows.length === 0 ? (
        <MobileEmptyState title={labels.noEntries} />
      ) : (
        <MobileContentInset>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {rows.map(row => (
              <StatusTrackingCard
                key={row.id ?? ""}
                row={row}
                labels={labels}
                onActivate={onActivate}
                onReschedule={onReschedule}
                onVerify={onVerify}
              />
            ))}
          </Box>
        </MobileContentInset>
      )}
    </Box>
  );
}
