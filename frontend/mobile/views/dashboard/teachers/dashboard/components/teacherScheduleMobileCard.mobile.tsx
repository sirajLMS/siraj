"use client";

import { Box } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { MeetingUrlCell } from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlCell";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { studentHref } from "@/frontend/common/utils/profileHref";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import { resolveScheduleCardAccentBorder } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleMobileCard.mobile.actions";
import { CardFooter } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleMobileCard.mobile.footer";
import {
  CardHeader,
  StudentInfoRow,
  TimeHighlight,
} from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/teacherScheduleMobileCard.mobile.parts";
import { resolveTeacherScheduleSessionActions } from "@/shared/lib/schedule/teacher-schedule-session-actions";

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
export function TeacherScheduleMobileCard({
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
