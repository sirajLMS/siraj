"use client";

import { Box, Grid } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ClassInstanceStatus } from "@/frontend/views/dashboard/types/dashboard";
import { LiveSessionToolbar } from "../components/LiveSessionToolbar";
import type { TeacherViewLabels } from "../useClassDetailsLabels";
import { ActionsPanel } from "./ActionsPanel";
import { ClassInstanceDetailsCard } from "./ClassInstanceDetailsCard";
import { PerformanceOverviewCard } from "./PerformanceOverviewCard";
import { RemarksCard } from "./RemarksCard";
import { StudentProfileCard } from "./StudentProfileCard";
import { TimezoneWarningBanner } from "./TimezoneWarningBanner";

interface ClassDetailsTeacherViewProps {
  readonly instance: ClassInstanceDetail;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onActivate: () => void;
  readonly onStop: () => void;
  readonly onInfoEdit: () => void;
  readonly onDelete: () => void;
  readonly onViewProfile: () => void;
  readonly labels: TeacherViewLabels;
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

export function ClassDetailsTeacherView({
  instance,
  isWarningDismissed,
  onDismissWarning,
  onActivate,
  onStop,
  onInfoEdit,
  onDelete,
  onViewProfile,
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
}: ClassDetailsTeacherViewProps) {
  const status = (instance.status as ClassInstanceStatus) || "pending";

  return (
    <Box>
      {/* Timezone Warning */}
      {!isWarningDismissed && instance.hasTimezoneMismatch && (
        <RequirePermission permissions={[AppPermission.ScheduleViewTimezones]}>
          <TimezoneWarningBanner
            studentTimezone={instance.studentTimezone ?? ""}
            onDismiss={onDismissWarning}
            labels={labels.timezone}
          />
        </RequirePermission>
      )}

      {/* Live Session Toolbar */}
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

      <Grid container spacing={3}>
        {/* Left Column: Details + Performance */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <ClassInstanceDetailsCard
              instanceId={instance.id ?? ""}
              studentName={instance.student?.name ?? ""}
              courseModule={instance.courseName ?? ""}
              startTime={instance.startTime ?? ""}
              endTime={instance.endTime ?? ""}
              durationMinutes={instance.durationMinutes ?? 0}
              status={status}
              labels={labels.instanceDetails}
            />
            <RemarksCard remarks={instance.remarks ?? ""} labels={labels.remarks} />
            <PerformanceOverviewCard
              attendanceRate={instance.performance?.attendanceRate ?? 0}
              avgGrade={instance.performance?.avgGrade ?? ""}
              lastClassDaysAgo={instance.performance?.lastClassDaysAgo ?? 0}
              labels={labels.performance}
            />
          </Box>
        </Grid>

        {/* Right Column: Actions + Student Profile */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <ActionsPanel
              onActivate={onActivate}
              onStop={onStop}
              onInfoEdit={onInfoEdit}
              onDelete={onDelete}
              labels={labels.actions}
            />
            <StudentProfileCard
              student={{
                id: instance.student?.id ?? "",
                name: instance.student?.name ?? "",
                grade: instance.student?.grade ?? "",
                level: Number(instance.student?.level ?? 0),
                avatarUrl: instance.student?.avatarUrl ?? "",
              }}
              onViewProfile={onViewProfile}
              labels={labels.studentProfile}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
