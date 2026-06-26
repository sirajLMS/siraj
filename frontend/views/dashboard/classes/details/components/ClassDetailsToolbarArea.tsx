"use client";

import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import { Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PrimaryPageAction } from "@/frontend/components/ui";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import { TimezoneWarningBanner } from "../teacher/TimezoneWarningBanner";
import { LiveSessionToolbar } from "./LiveSessionToolbar";

export interface ClassDetailsToolbarAreaProps {
  readonly instance: ClassInstanceDetail;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly labels: {
    readonly timezone: {
      readonly title: string;
      readonly description: string;
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
  const zoomMeetingUrl = instance.zoomMeetingUrl?.trim();

  const handleJoinZoom = () => {
    if (zoomMeetingUrl) {
      window.open(zoomMeetingUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      {!isWarningDismissed && instance.hasTimezoneMismatch && (
        <RequirePermission permissions={[AppPermission.ScheduleViewTimezones]}>
          <TimezoneWarningBanner
            studentTimezone={instance.studentTimezone ?? ""}
            onDismiss={onDismissWarning}
            labels={labels.timezone}
          />
        </RequirePermission>
      )}

      {zoomMeetingUrl ? (
        <Stack direction="row" sx={{ mb: 2 }}>
          <PrimaryPageAction startIcon={<VideocamOutlined />} onClick={handleJoinZoom} id={`join-zoom-${instance.id}`}>
            {t("joinZoom")}
          </PrimaryPageAction>
        </Stack>
      ) : null}

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
    </>
  );
}
