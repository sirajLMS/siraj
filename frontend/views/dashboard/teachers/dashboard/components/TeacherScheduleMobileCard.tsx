"use client";

import { AccessTimeOutlined, VideocamOffOutlined, VideocamOutlined, VisibilityOutlined } from "@mui/icons-material";
import { alpha, Box, Button, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ActionIconLink, StatusBadge, UserAvatar } from "@/frontend/components/ui";
import type { TeacherScheduleRow } from "@/frontend/stores/teacherDashboardTypes";
import { studentHref } from "@/frontend/utils/profileHref";
import { formatDurationMinutes } from "@/frontend/views/dashboard/admin/home/utils/formatScheduleTime";
import type { TeacherDashboardLabels } from "@/frontend/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { resolveTeacherScheduleActionTooltips } from "@/frontend/views/dashboard/teachers/dashboard/utils/resolveTeacherScheduleActionTooltips";
import {
  getStatusLabel,
  resolveTeacherStatusBadge,
} from "@/frontend/views/dashboard/teachers/dashboard/utils/sessionStatusUtils";
import { Link } from "@/shared/i18n/routing";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/schedule/teacher-schedule-session-actions";
import { SessionActivateButton } from "./SessionActivateButton";
import { TeacherActiveSessionControls } from "./TeacherActiveSessionControls";
import { TeacherScheduleStatusContent } from "./TeacherScheduleStatusContent";

const StyledScheduleCard = styled(Paper, {
  shouldForwardProp: prop => prop !== "isLive",
})<{ isLive: boolean }>(({ theme, isLive }) => ({
  paddingBlock: theme.spacing(2),
  paddingInline: theme.spacing(2),
  borderRadius: 0,
  backgroundColor: theme.palette.surfaceContainerLowest,
  boxShadow: "none",
  overflow: "hidden",
  width: "100%",
  opacity: 1,
  borderInlineStart: isLive ? `4px solid ${theme.palette.primary.main}` : undefined,
}));

const StyledCardList = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  backgroundColor: theme.palette.surfaceContainerHighest,
}));

const StyledTimeHighlight = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: theme.layout.radius.card,
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
  minWidth: 0,
  overflow: "hidden",
}));

interface TeacherScheduleMobileCardProps {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardLabels;
  readonly canActivate: boolean;
  readonly onJoinVideo: (id: string) => void;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}

function renderFooterAction(
  row: TeacherScheduleRow,
  labels: TeacherDashboardLabels,
  canActivate: boolean,
  onActivate?: (id: string) => void,
  onStartSession?: (id: string) => void,
  onMarkAbsent?: (id: string) => void,
  onRequestLeave?: (id: string) => void
) {
  const actions = resolveTeacherScheduleSessionActions({
    executionState: row.executionState,
    outcome: row.outcome,
    activateEnabled: row.activateEnabled,
    canActivate,
    videoEnabled: row.videoEnabled,
    isConnecting: row.status === "connecting",
  });

  if (
    row.status === "completed" ||
    (!actions.activate && !actions.start && !actions.markAbsent && !actions.requestLeave)
  ) {
    if (row.status === "completed") {
      return (
        <Button fullWidth disabled variant="outlined" sx={{ typography: "labelUppercase" }}>
          {labels.schedule.sessionEnded}
        </Button>
      );
    }
    return <TeacherScheduleStatusContent row={row} labels={labels} canActivate={canActivate} onActivate={onActivate} />;
  }

  if (actions.activate) {
    const tooltips = resolveTeacherScheduleActionTooltips(row, labels);
    return (
      <SessionActivateButton
        disabled={!row.activateEnabled || row.status === "connecting"}
        isConnecting={row.status === "connecting"}
        activateLabel={labels.actions.activateSession}
        connectingLabel={labels.actions.connecting}
        tooltip={tooltips.activate}
        onActivate={() => onActivate?.(row.id)}
      />
    );
  }

  if (actions.start || actions.markAbsent || actions.requestLeave) {
    const tooltips = resolveTeacherScheduleActionTooltips(row, labels);
    return (
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
          {labels.activeControls.sessionControls}
        </Typography>
        <TeacherActiveSessionControls
          labels={labels.activeControls}
          showStart={actions.start}
          showMarkAbsent={actions.markAbsent}
          showRequestLeave={actions.requestLeave}
          startTooltip={tooltips.start}
          markAbsentTooltip={tooltips.markAbsent}
          requestLeaveTooltip={tooltips.requestLeave}
          markAbsentDisabled={row.markAbsentEnabled === false}
          onStart={() => onStartSession?.(row.id)}
          onMarkAbsent={() => onMarkAbsent?.(row.id)}
          onRequestLeave={() => onRequestLeave?.(row.id)}
        />
      </Box>
    );
  }

  return null;
}

function StudentNameLink({
  studentName,
  studentHref,
}: {
  readonly studentName: string;
  readonly studentHref?: string;
}) {
  if (studentHref) {
    return (
      <Typography
        component={Link}
        href={studentHref}
        sx={{
          typography: "titleLg",
          color: theme => theme.palette.primary.main,
          textDecoration: "none",
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          "&:hover": { textDecoration: "underline" },
        }}
      >
        {studentName}
      </Typography>
    );
  }
  return (
    <Typography
      sx={{
        typography: "titleLg",
        color: theme => theme.palette.primary.main,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {studentName}
    </Typography>
  );
}

function CardHeader({
  row,
  labels,
  canActivate,
  isLive,
  studentHref,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardLabels;
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
        <StudentNameLink studentName={row.studentName} studentHref={studentHref} />
        {!canActivate || row.status === "pending" || row.status === "connecting" ? null : (
          <Box sx={{ mt: 0.75 }}>
            <StatusBadge
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
          <ActionIconLink href={`/classes/${row.id}`} aria-label={labels.schedule.classId}>
            <VisibilityOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      </Box>
    </Box>
  );
}

function TimeHighlight({ row, labels }: { readonly row: TeacherScheduleRow; readonly labels: TeacherDashboardLabels }) {
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

function StudentInfoRow({ row }: { readonly row: TeacherScheduleRow }) {
  const href = row.studentId ? studentHref(row.studentId) : undefined;

  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1,
        mb: 1.5,
        borderTop: `1px solid ${theme.palette.border.light}`,
      })}
    >
      <UserAvatar label={row.studentName} size={32}>
        {row.studentInitials}
      </UserAvatar>
      {href ? (
        <Typography
          component={Link}
          href={href}
          sx={{
            typography: "bodyMd",
            color: theme => theme.palette.primary.main,
            textDecoration: "none",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {row.studentName}
        </Typography>
      ) : (
        <Typography sx={{ typography: "bodyMd", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
          {row.studentName}
        </Typography>
      )}
    </Box>
  );
}

function VideoButton({
  row,
  labels,
  tooltip,
  onJoinVideo,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardLabels;
  readonly tooltip: string;
  readonly onJoinVideo: (id: string) => void;
}) {
  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton
          disabled={!row.videoEnabled}
          onClick={() => {
            if (row.videoEnabled) {
              onJoinVideo(row.id);
            }
          }}
          aria-label={labels.actions.joinVideo}
          sx={theme => ({
            border: `1px solid ${theme.palette.border.light}`,
            borderRadius: 1,
            flexShrink: 0,
          })}
        >
          {row.videoEnabled ? <VideocamOutlined /> : <VideocamOffOutlined />}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function CardFooter({
  row,
  labels,
  canActivate,
  isCompleted,
  sessionActions,
  actionTooltips,
  onJoinVideo,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardLabels;
  readonly canActivate: boolean;
  readonly isCompleted: boolean;
  readonly sessionActions: ReturnType<typeof resolveTeacherScheduleSessionActions>;
  readonly actionTooltips: ReturnType<typeof resolveTeacherScheduleActionTooltips>;
  readonly onJoinVideo: (id: string) => void;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {renderFooterAction(row, labels, canActivate, onActivate, onStartSession, onMarkAbsent, onRequestLeave)}
      </Box>
      {!isCompleted && sessionActions.joinVideo ? (
        <VideoButton row={row} labels={labels} tooltip={actionTooltips.joinVideo} onJoinVideo={onJoinVideo} />
      ) : null}
    </Box>
  );
}

export function TeacherScheduleMobileCard({
  row,
  labels,
  canActivate,
  onJoinVideo,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: Readonly<TeacherScheduleMobileCardProps>) {
  const isCompleted = row.status === "completed";
  const isLive = row.isLive === true;
  const studentHrefValue = row.studentId ? studentHref(row.studentId) : undefined;
  const sessionActions = resolveTeacherScheduleSessionActions({
    executionState: row.executionState,
    outcome: row.outcome,
    activateEnabled: row.activateEnabled,
    canActivate,
    videoEnabled: row.videoEnabled,
    isConnecting: row.status === "connecting",
  });
  const actionTooltips = resolveTeacherScheduleActionTooltips(row, labels);

  return (
    <StyledScheduleCard elevation={0} isLive={isLive} sx={{ opacity: isCompleted ? 0.7 : 1 }}>
      <CardHeader row={row} labels={labels} canActivate={canActivate} isLive={isLive} studentHref={studentHrefValue} />
      <TimeHighlight row={row} labels={labels} />
      <StudentInfoRow row={row} />
      <CardFooter
        row={row}
        labels={labels}
        canActivate={canActivate}
        isCompleted={isCompleted}
        sessionActions={sessionActions}
        actionTooltips={actionTooltips}
        onJoinVideo={onJoinVideo}
        onActivate={onActivate}
        onStartSession={onStartSession}
        onMarkAbsent={onMarkAbsent}
        onRequestLeave={onRequestLeave}
      />
    </StyledScheduleCard>
  );
}

interface TeacherScheduleMobileCardListProps {
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardLabels;
  readonly canActivate: boolean;
  readonly emptyMessage: string;
  readonly onJoinVideo: (id: string) => void;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}

export function TeacherScheduleMobileCardList({
  rows,
  labels,
  canActivate,
  emptyMessage,
  onJoinVideo,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: Readonly<TeacherScheduleMobileCardListProps>) {
  if (rows.length === 0) {
    return (
      <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <StyledCardList>
      {rows.map(row => (
        <TeacherScheduleMobileCard
          key={row.id}
          row={row}
          labels={labels}
          canActivate={canActivate}
          onJoinVideo={onJoinVideo}
          onActivate={onActivate}
          onStartSession={onStartSession}
          onMarkAbsent={onMarkAbsent}
          onRequestLeave={onRequestLeave}
        />
      ))}
    </StyledCardList>
  );
}
