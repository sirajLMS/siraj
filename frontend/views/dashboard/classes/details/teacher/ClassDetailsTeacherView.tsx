"use client";

import { Box, Grid } from "@mui/material";
import type { ClassInstance, ClassInstanceStatus } from "@/frontend/views/dashboard/types/dashboard";
import { ActionsPanel } from "./ActionsPanel";
import { ClassInstanceDetailsCard } from "./ClassInstanceDetailsCard";
import { PerformanceOverviewCard } from "./PerformanceOverviewCard";
import { RemarksCard } from "./RemarksCard";
import { StudentProfileCard } from "./StudentProfileCard";
import { TimezoneWarningBanner } from "./TimezoneWarningBanner";

interface TeacherViewLabels {
  readonly timezone: {
    readonly title: string;
    readonly description: string;
  };
  readonly instanceDetails: {
    readonly classInstanceDetails: string;
    readonly studentName: string;
    readonly courseModule: string;
    readonly startTime: string;
    readonly endTime: string;
    readonly duration: string;
    readonly status: string;
    readonly minutes: string;
    readonly statusLabels: Record<ClassInstanceStatus, string>;
  };
  readonly remarks: {
    readonly remarksTitle: string;
  };
  readonly performance: {
    readonly previousPerformanceOverview: string;
    readonly attendanceRate: string;
    readonly avgGrade: string;
    readonly lastClass: string;
    readonly days: string;
  };
  readonly actions: {
    readonly actions: string;
    readonly activate: string;
    readonly stopPause: string;
    readonly infoEdit: string;
    readonly delete: string;
    readonly contextualHelp: string;
  };
  readonly studentProfile: {
    readonly studentLevel: string;
    readonly viewFullProfile: string;
  };
}

interface ClassDetailsTeacherViewProps {
  readonly instance: ClassInstance;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onActivate: () => void;
  readonly onStop: () => void;
  readonly onInfoEdit: () => void;
  readonly onDelete: () => void;
  readonly onViewProfile: () => void;
  readonly labels: TeacherViewLabels;
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
}: ClassDetailsTeacherViewProps) {
  return (
    <Box>
      {/* Timezone Warning */}
      {!isWarningDismissed && instance.hasTimezoneMismatch && (
        <TimezoneWarningBanner
          studentTimezone={instance.studentTimezone}
          onDismiss={onDismissWarning}
          labels={labels.timezone}
        />
      )}

      <Grid container spacing={3}>
        {/* Left Column: Details + Performance */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <ClassInstanceDetailsCard
              instanceId={instance.id}
              studentName={instance.student.name}
              courseModule={instance.courseName}
              startTime={instance.startTime}
              endTime={instance.endTime}
              durationMinutes={instance.durationMinutes}
              status={instance.status}
              labels={labels.instanceDetails}
            />
            <RemarksCard remarks={instance.remarks} labels={labels.remarks} />
            <PerformanceOverviewCard
              attendanceRate={instance.attendanceRate}
              avgGrade={instance.avgGrade}
              lastClassDaysAgo={instance.lastClassDaysAgo}
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
              student={instance.student}
              onViewProfile={onViewProfile}
              labels={labels.studentProfile}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
