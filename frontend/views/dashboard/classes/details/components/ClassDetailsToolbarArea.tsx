"use client";

import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import type { MeetingJoinEmptyRole } from "@/frontend/components/ui/display/meetingConfig/MeetingJoinAction";
import { MeetingJoinAction } from "@/frontend/components/ui/display/meetingConfig/MeetingJoinAction";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  classDetailsContentPaddingSx,
  classDetailsSectionStackSx,
} from "@/frontend/views/dashboard/classes/details/classDetailsMobileLayout";
import { LiveSessionToolbar } from "@/frontend/views/dashboard/classes/details/components/LiveSessionToolbar";
import { TimezoneWarningBanner } from "@/frontend/views/dashboard/classes/details/teacher/TimezoneWarningBanner";

export type ClassDetailsToolbarViewMode = "teacher" | "parent" | "admin";

export interface ClassDetailsToolbarAreaProps {
  readonly instance: ClassInstanceDetail;
  readonly viewMode: ClassDetailsToolbarViewMode;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly labels: {
    readonly timezone: {
      readonly title: string;
      readonly prefix: string;
      readonly suffix: string;
    };
  };
  readonly onStart: () => void;
  readonly onAbsent: () => void;
  readonly onLeave: (reason: string) => void;
  readonly onReset: () => void;
  readonly isStarting: boolean;
  readonly isMarkingAbsent: boolean;
  readonly isProcessingLeave: boolean;
  readonly isResetting: boolean;
  readonly error: string | null;
}

function resolveJoinEmptyState(
  viewMode: ClassDetailsToolbarViewMode,
  instanceId: string
): { emptyRole: MeetingJoinEmptyRole; setupHref?: string } {
  if (viewMode === "parent") {
    return { emptyRole: "parent" };
  }
  if (viewMode === "teacher") {
    return { emptyRole: "teacher", setupHref: "/profile?tab=meeting" };
  }
  return { emptyRole: "class", setupHref: `/classes/${instanceId}#meeting-configs` };
}

export function ClassDetailsToolbarArea({
  instance,
  viewMode,
  isWarningDismissed,
  onDismissWarning,
  labels,
  onStart,
  onAbsent,
  onLeave,
  onReset,
  isStarting,
  isMarkingAbsent,
  isProcessingLeave,
  isResetting,
  error,
}: ClassDetailsToolbarAreaProps) {
  const tJoin = useTranslations("ui.meetingConfig.join");
  const meeting = instance.effectiveMeeting;
  const joinUrl = meeting?.joinUrl?.trim() || instance.meetingJoinUrl?.trim();
  const joinLabel = tJoin("joinMeeting");
  const instanceId = instance.id ?? "";
  const emptyState = resolveJoinEmptyState(viewMode, instanceId);

  return (
    <Box sx={classDetailsSectionStackSx}>
      {!isWarningDismissed && instance.hasTimezoneMismatch && (
        <RequirePermission permissions={[AppPermission.ScheduleViewTimezones]}>
          <TimezoneWarningBanner
            studentTimezone={instance.studentTimezone ?? ""}
            onDismiss={onDismissWarning}
            labels={labels.timezone}
          />
        </RequirePermission>
      )}

      <Stack direction="row" sx={classDetailsContentPaddingSx}>
        <MeetingJoinAction
          joinUrl={joinUrl}
          meeting={meeting}
          label={joinLabel}
          id={`join-meeting-${instanceId}`}
          emptyRole={emptyState.emptyRole}
          setupHref={emptyState.setupHref}
        />
      </Stack>

      {viewMode !== "parent" ? (
        <Box sx={classDetailsContentPaddingSx}>
          <LiveSessionToolbar
            classInstanceId={instanceId}
            executionState={instance.executionState ?? "NOT_ACTIVATED"}
            onStart={onStart}
            onAbsent={onAbsent}
            onLeave={onLeave}
            onReset={onReset}
            isStarting={isStarting}
            isMarkingAbsent={isMarkingAbsent}
            isProcessingLeave={isProcessingLeave}
            isResetting={isResetting}
            error={error}
          />
        </Box>
      ) : null}
    </Box>
  );
}
