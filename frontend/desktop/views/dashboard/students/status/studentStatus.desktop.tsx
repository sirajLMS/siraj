"use client";

import { Box, Grid, Paper, Typography } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import type { StudentStatusViewModel } from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page/DesktopPageContainer";
import { DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page/DesktopPageHeader";
import { AdminHoldControlsDesktop } from "@/frontend/desktop/views/dashboard/students/status/components/adminHoldControls.desktop";
import {
  PolicyOverviewCardDesktop,
  SuspensionWarningBannerDesktop,
} from "@/frontend/desktop/views/dashboard/students/status/components/policyOverviewCard.desktop";
import { StudentStatusHeaderDesktop } from "@/frontend/desktop/views/dashboard/students/status/components/studentStatusHeader.desktop";
import { UpcomingClassesTableDesktop } from "@/frontend/desktop/views/dashboard/students/status/components/upcomingClassesTable.desktop";
import { useAppTranslation } from "@/shared/locale";

const STATUS_BADGE_MAP: Record<string, string> = {
  [StudentStatus.Regular]: "regular",
  [StudentStatus.Suspended]: "suspended",
  [StudentStatus.OnLeave]: "on_leave",
  [StudentStatus.OnTrial]: "on_trial",
  [StudentStatus.Deactivated]: "deactivated",
};

function getBadgeStatusKey(status: StudentStatus): string {
  return STATUS_BADGE_MAP[status] ?? "regular";
}

function ReadOnlyStatusCardDesktop({ status }: Readonly<{ status: StudentStatus }>) {
  const t = useAppTranslation().dashboardTranslations.studentStatus;

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: "cardPadding",
        border: `1px solid ${theme.palette.border.main}`,
      })}
    >
      <Typography
        variant="labelMd"
        sx={theme => ({ color: theme.palette.onSurfaceVariant, mb: 1.5, display: "block" })}
      >
        {t.fields.accountStatus}
      </Typography>
      <StatusBadge category="studentAccount" status={getBadgeStatusKey(status)} label={t.statusOptions[status]} />
    </Paper>
  );
}

function StudentStatusLeftColumnDesktop({
  canEditStatus,
  isUpdating,
  methods,
  handleSubmit,
  student,
}: Readonly<Pick<StudentStatusViewModel, "canEditStatus" | "isUpdating" | "methods" | "handleSubmit" | "student">>) {
  if (!canEditStatus) {
    return <ReadOnlyStatusCardDesktop status={student.status} />;
  }

  return (
    <Box
      component="form"
      onSubmit={e => {
        methods.handleSubmit(handleSubmit)(e);
      }}
      sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}
    >
      <FormProvider {...methods}>
        <AdminHoldControlsDesktop isUpdating={isUpdating} />
      </FormProvider>
      <PolicyOverviewCardDesktop />
    </Box>
  );
}

function StudentStatusRightColumnDesktop({
  canEditStatus,
  selectedStatus,
  classes,
  studentId,
}: Readonly<{
  canEditStatus: boolean;
  selectedStatus: StudentStatus;
  classes: StudentStatusViewModel["student"]["upcomingClasses"];
  studentId: string;
}>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}>
      {canEditStatus && selectedStatus === StudentStatus.Suspended ? <SuspensionWarningBannerDesktop /> : null}
      <UpcomingClassesTableDesktop classes={classes} studentId={studentId} />
    </Box>
  );
}

function StudentStatusBodyDesktop({
  t,
  student,
  embedded,
  isUpdating,
  canEditStatus,
  hasLeftColumn,
  hasRightColumn,
  selectedStatus,
  methods,
  handleSubmit,
}: Readonly<StudentStatusViewModel>) {
  return (
    <>
      {embedded ? null : (
        <DesktopPageHeader
          title={t.pageTitle}
          subtitle={t.studentId(student.id)}
          breadcrumbs={[
            { label: t.breadcrumbs.students, href: "/students" },
            { label: t.breadcrumbs.statusHold, current: true },
          ]}
        />
      )}
      <StudentStatusHeaderDesktop student={student} embedded={embedded} />

      <Grid container spacing="gutter">
        {hasLeftColumn ? (
          <Grid size={{ xs: 12, lg: hasRightColumn ? 4 : 12 }}>
            <StudentStatusLeftColumnDesktop
              canEditStatus={canEditStatus}
              isUpdating={isUpdating}
              methods={methods}
              handleSubmit={handleSubmit}
              student={student}
            />
          </Grid>
        ) : null}

        {hasRightColumn ? (
          <Grid size={{ xs: 12, lg: hasLeftColumn ? 8 : 12 }}>
            <StudentStatusRightColumnDesktop
              canEditStatus={canEditStatus}
              selectedStatus={selectedStatus}
              classes={student.upcomingClasses}
              studentId={student.id}
            />
          </Grid>
        ) : null}
      </Grid>
    </>
  );
}

export function StudentStatusDesktopView({
  t,
  student,
  embedded,
  isUpdating,
  canEditStatus,
  hasTabAccess,
  hasLeftColumn,
  hasRightColumn,
  hasContent,
  selectedStatus,
  methods,
  handleSubmit,
}: Readonly<StudentStatusViewModel>) {
  if (!hasTabAccess || !hasContent) {
    const restricted = <ProfileRestrictedSection title={t.pageTitle} />;
    return embedded ? restricted : <DesktopPageContainer>{restricted}</DesktopPageContainer>;
  }

  const body = (
    <StudentStatusBodyDesktop
      t={t}
      student={student}
      embedded={embedded}
      isUpdating={isUpdating}
      canEditStatus={canEditStatus}
      hasLeftColumn={hasLeftColumn}
      hasRightColumn={hasRightColumn}
      hasContent={hasContent}
      hasTabAccess={hasTabAccess}
      canViewSchedule={false}
      selectedStatus={selectedStatus}
      methods={methods}
      handleSubmit={handleSubmit}
    />
  );

  if (embedded) {
    return body;
  }

  return <DesktopPageContainer>{body}</DesktopPageContainer>;
}
