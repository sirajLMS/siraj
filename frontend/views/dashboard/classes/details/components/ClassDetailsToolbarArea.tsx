"use client";

import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PrimaryPageAction } from "@/frontend/components/ui";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  classDetailsContentPaddingSx,
  classDetailsSectionStackSx,
} from "@/frontend/views/dashboard/classes/details/classDetailsMobileLayout";
import { LiveSessionToolbar } from "@/frontend/views/dashboard/classes/details/components/LiveSessionToolbar";
import { TimezoneWarningBanner } from "@/frontend/views/dashboard/classes/details/teacher/TimezoneWarningBanner";

export interface ClassDetailsToolbarAreaProps {
  readonly instance: ClassInstanceDetail;
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

export function ClassDetailsToolbarArea({
  instance,
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
  const t = useTranslations("dashboard.classDetails.liveSession");
  const meetingJoinUrl = instance.meetingJoinUrl?.trim();

  const handleJoinZoom = () => {
    if (meetingJoinUrl) {
      window.open(meetingJoinUrl, "_blank", "noopener,noreferrer");
    }
  };

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

      {meetingJoinUrl ? (
        <Stack direction="row" sx={classDetailsContentPaddingSx}>
          <PrimaryPageAction startIcon={<VideocamOutlined />} onClick={handleJoinZoom} id={`join-zoom-${instance.id}`}>
            {t("joinZoom")}
          </PrimaryPageAction>
        </Stack>
      ) : null}

      <Box sx={classDetailsContentPaddingSx}>
        <LiveSessionToolbar
          classInstanceId={instance.id ?? ""}
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
    </Box>
  );
}
