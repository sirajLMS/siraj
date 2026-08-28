"use client";

import { AccessTimeOutlined, AcUnitOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { MeetingUrlCell } from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlCell";
import { AppPermission, ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { formatDurationMinutes } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import { StyledTimeHighlight } from "@/frontend/common/views/dashboard/components/__shared__/timeHighlightShared.styles";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { resolveTeacherScheduleActionTooltips } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/resolveTeacherScheduleActionTooltips";
import {
  getStatusLabel,
  resolveTeacherStatusBadge,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/sessionStatusUtils";
import {
  MobileActionIconLink,
  MobileCardListItem,
  type MobileCardListItemProps,
  MobileStatusBadge,
  MobileUserAvatar,
} from "@/frontend/mobile/components/ui";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { SessionActivateButtonMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/sessionActivateButton.mobile";
import { TeacherActiveSessionControlsMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherActiveSessionControls.mobile";
import { TeacherScheduleStatusContentMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleStatusContent.mobile";
import { Link } from "@/shared/i18n";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/schedule/teacher-schedule-session-actions";

type ScheduleCardAccentBorder = MobileCardListItemProps["accentBorder"];

/**
 * Accent precedence mirrors the historical shell: a frozen row always shows the
 * info accent; otherwise a live row shows the primary accent.
 */
function resolveScheduleCardAccentBorder(isFrozen: boolean, isLive: boolean): ScheduleCardAccentBorder {
  if (isFrozen) {
    return { color: "info", side: "inline-start" };
  }
  if (isLive) {
    return { color: "primary", side: "inline-start" };
  }
  return undefined;
}

interface TeacherScheduleMobileCardProps {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}

/**
 * Mobile schedule-row card. Relocated from
 * `frontend/common/views/dashboard/teachers/dashboard/components/TeacherScheduleMobileCard.tsx`
 * per the "no Mobile* in common" tier-isolation rule. The implementation now
 * imports its tier-specific sub-components (SessionActivateButton,
 * TeacherActiveSessionControls, TeacherScheduleStatusContent) from sibling
 * `.mobile.tsx` files.
 */
function renderFooterAction(
  row: TeacherScheduleRow,
  labels: TeacherDashboardViewLabels,
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
    isFrozen: row.isFrozen,
  });

  const isSessionEnded = row.executionState === ClassExecutionState.Completed || row.outcome === ClassOutcome.Taken;
  const isFrozen = row.isFrozen === true;

  if (isFrozen) {
    return (
      <Tooltip title={labels.schedule.contactAdmin}>
        <Button
          fullWidth
          disabled
          variant="outlined"
          startIcon={<AcUnitOutlined />}
          sx={{ typography: "labelUppercase" }}
        >
          {labels.schedule.frozen}
        </Button>
      </Tooltip>
    );
  }

  if (isSessionEnded || (!actions.activate && !actions.start && !actions.markAbsent && !actions.requestLeave)) {
    if (isSessionEnded) {
      return (
        <Button fullWidth disabled variant="outlined" sx={{ typography: "labelUppercase" }}>
          {labels.schedule.sessionEnded}
        </Button>
      );
    }
    return (
      <TeacherScheduleStatusContentMobile row={row} labels={labels} canActivate={canActivate} onActivate={onActivate} />
    );
  }

  if (actions.activate) {
    const tooltips = resolveTeacherScheduleActionTooltips(row, labels, labels.meetingLabels);
    return (
      <SessionActivateButtonMobile
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
    const tooltips = resolveTeacherScheduleActionTooltips(row, labels, labels.meetingLabels);
    return (
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
          {labels.activeControls.sessionControls}
        </Typography>
        <TeacherActiveSessionControlsMobile
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
  studentHref: href,
}: {
  readonly studentName: string;
  readonly studentHref?: string;
}) {
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <Typography
          sx={{
            typography: "titleLg",
            color: theme => theme.palette.primary.main,
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {studentName}
        </Typography>
      </Link>
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
        <StudentNameLink studentName={row.studentName} studentHref={href} />
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

function TimeHighlight({
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
      <MobileUserAvatar label={row.studentName} size={32}>
        {row.studentInitials}
      </MobileUserAvatar>
      {href ? (
        <Link href={href} style={{ textDecoration: "none" }}>
          <Typography
            sx={{
              typography: "bodyMd",
              color: theme => theme.palette.primary.main,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {row.studentName}
          </Typography>
        </Link>
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
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
}) {
  return (
    <MobileMeetingJoinAction
      variant="icon"
      joinUrl={row.meetingJoinUrl}
      meeting={row.effectiveMeeting}
      disabled={!row.videoEnabled}
      label={labels.actions.joinVideo}
      emptyRole="teacher"
      setupHref="/profile?tab=meeting"
    />
  );
}

function CardFooter({
  row,
  labels,
  canActivate,
  sessionActions,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly sessionActions: ReturnType<typeof resolveTeacherScheduleSessionActions>;
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
      {sessionActions.joinVideo ? <VideoButton row={row} labels={labels} /> : null}
    </Box>
  );
}

export function TeacherScheduleMobileCardItem({
  row,
  labels,
  canActivate,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: Readonly<TeacherScheduleMobileCardProps>) {
  const isCompleted = row.status === "completed";
  const isFrozen = row.isFrozen === true;
  const isLive = row.isLive === true;
  const studentHrefValue = row.studentId ? studentHref(row.studentId) : undefined;
  const sessionActions = resolveTeacherScheduleSessionActions({
    executionState: row.executionState,
    outcome: row.outcome,
    activateEnabled: row.activateEnabled,
    canActivate,
    videoEnabled: row.videoEnabled,
    isConnecting: row.status === "connecting",
    isFrozen: row.isFrozen,
  });

  return (
    <MobileCardListItem
      variant="edge-to-edge"
      dimmed={isCompleted}
      dimmedOpacity={0.7}
      accentBorder={resolveScheduleCardAccentBorder(isFrozen, isLive)}
    >
      <CardHeader row={row} labels={labels} canActivate={canActivate} isLive={isLive} studentHref={studentHrefValue} />
      <TimeHighlight row={row} labels={labels} />
      <StudentInfoRow row={row} />
      <Box sx={{ mb: 1.5 }}>
        <RequirePermission
          permissions={[AppPermission.MeetingConfigsManageOwn, AppPermission.MeetingConfigsManageClass]}
          fallback={
            <MeetingUrlCell
              meetingUrl={row.meetingJoinUrl}
              meetingUrlStatus={row.meetingUrlStatus}
              meetingUrlError={row.meetingUrlError}
              joinLabel={labels.actions.joinVideo}
              setupHref="/profile?tab=meeting"
              badgeSize="medium"
              canCopyUrl={false}
            />
          }
        >
          <MeetingUrlCell
            meetingUrl={row.meetingJoinUrl}
            meetingUrlStatus={row.meetingUrlStatus}
            meetingUrlError={row.meetingUrlError}
            joinLabel={labels.actions.joinVideo}
            setupHref="/profile?tab=meeting"
            badgeSize="medium"
            canCopyUrl
          />
        </RequirePermission>
      </Box>
      <CardFooter
        row={row}
        labels={labels}
        canActivate={canActivate}
        sessionActions={sessionActions}
        onActivate={onActivate}
        onStartSession={onStartSession}
        onMarkAbsent={onMarkAbsent}
        onRequestLeave={onRequestLeave}
      />
    </MobileCardListItem>
  );
}

/**
 * Re-exported under the historical `TeacherScheduleMobileCard` name so the
 * thin `teacherScheduleCard.mobile.tsx` wrapper keeps its current contract.
 * Mobile view is the only legitimate consumer of this implementation.
 */
export const TeacherScheduleMobileCard = TeacherScheduleMobileCardItem;
