"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { canViewStudentProfileTab } from "@/frontend/common/views/dashboard/students/profile/studentProfileTabs";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { AdminHoldControls } from "@/frontend/common/views/dashboard/students/status/components/AdminHoldControls";
import {
  PolicyOverviewCard,
  SuspensionWarningBanner,
} from "@/frontend/common/views/dashboard/students/status/components/PolicyOverviewCard";
import { StudentStatusHeader } from "@/frontend/common/views/dashboard/students/status/components/StudentStatusHeader";
import { UpcomingClassesTable } from "@/frontend/common/views/dashboard/students/status/components/UpcomingClassesTable";
import {
  createStatusUpdateSchema,
  type StatusUpdateFormData,
} from "@/frontend/common/views/dashboard/students/status/schemas/statusUpdateSchema";
import type { StudentStatusViewProps } from "@/frontend/common/views/dashboard/students/status/types";
import { useAppTranslation } from "@/shared/locale/client";

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

function ReadOnlyStatusCard({ status }: Readonly<{ status: StudentStatus }>) {
  const t = useAppTranslation("dashboard.studentStatus");

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

function StudentStatusViewHeader({
  t,
  student,
  embedded,
}: Readonly<{
  t: ReturnType<typeof useAppTranslation<"dashboard.studentStatus">>;
  student: StudentStatusViewProps["student"];
  embedded: boolean;
}>) {
  if (embedded) return null;

  return (
    <PageHeader
      title={t.pageTitle}
      subtitle={t.studentId(student.id)}
      breadcrumbs={[
        { label: t.breadcrumbs.students, href: "/students" },
        { label: t.breadcrumbs.statusHold, current: true },
      ]}
    />
  );
}

function StudentStatusViewLeftColumn({
  canEditStatus,
  isUpdating,
  methods,
  handleSubmit,
}: Readonly<{
  canEditStatus: boolean;
  isUpdating: boolean;
  methods: ReturnType<typeof useForm<StatusUpdateFormData>>;
  handleSubmit: (data: StatusUpdateFormData) => Promise<void>;
}>) {
  if (!canEditStatus) return null;

  return (
    <Box
      component="form"
      onSubmit={e => {
        methods.handleSubmit(handleSubmit)(e);
      }}
      sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}
    >
      <FormProvider {...methods}>
        <AdminHoldControls isUpdating={isUpdating} />
      </FormProvider>
      <PolicyOverviewCard />
    </Box>
  );
}

function StudentStatusViewRightColumn({
  canEditStatus,
  selectedStatus,
  classes,
  studentId,
}: Readonly<{
  canEditStatus: boolean;
  selectedStatus: StudentStatus;
  classes: StudentStatusViewProps["student"]["upcomingClasses"];
  studentId: string;
}>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "gutter" }}>
      {canEditStatus && selectedStatus === StudentStatus.Suspended ? <SuspensionWarningBanner /> : null}
      <UpcomingClassesTable classes={classes} studentId={studentId} />
    </Box>
  );
}

export function StudentStatusView({
  student,
  isUpdating,
  embedded = false,
  onUpdateStatus,
}: Readonly<StudentStatusViewProps>) {
  const t = useAppTranslation("dashboard.studentStatus");
  const { canView, canEdit } = useStudentFieldAccess();

  const canEditStatus = canEdit("student_academic");
  const canViewStatus = canView("student_academic");
  const canViewSchedule = canView("student_schedule");
  const hasTabAccess = canViewStudentProfileTab("status", canView);

  const schema = createStatusUpdateSchema(t.validation);

  const methods = useForm<StatusUpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: StudentStatus.Regular,
      reason: "",
    },
  });

  const selectedStatus = useWatch({
    control: methods.control,
    name: "status",
    defaultValue: StudentStatus.Regular,
  });

  useEffect(() => {
    methods.reset({
      status: student.status,
      reason: "",
    });
  }, [student, methods]);

  const handleSubmit = async (data: StatusUpdateFormData) => {
    await onUpdateStatus(data.status, data.reason);
    methods.reset({ status: data.status, reason: "" });
  };

  const hasLeftColumn = canEditStatus || (canViewStatus && !canEditStatus);
  const hasRightColumn = canViewSchedule;
  const hasContent = hasLeftColumn || hasRightColumn;

  if (!hasTabAccess || !hasContent) {
    const restricted = <ProfileRestrictedSection title={t.pageTitle} />;
    return embedded ? restricted : <PageContainer>{restricted}</PageContainer>;
  }

  const body = (
    <>
      <StudentStatusViewHeader t={t} student={student} embedded={embedded} />
      <StudentStatusHeader student={student} embedded={embedded} />

      <Grid container spacing="gutter">
        {hasLeftColumn ? (
          <Grid size={{ xs: 12, lg: hasRightColumn ? 4 : 12 }}>
            {canEditStatus ? (
              <StudentStatusViewLeftColumn
                canEditStatus={canEditStatus}
                isUpdating={isUpdating}
                methods={methods}
                handleSubmit={handleSubmit}
              />
            ) : (
              <ReadOnlyStatusCard status={student.status} />
            )}
          </Grid>
        ) : null}

        {hasRightColumn ? (
          <Grid size={{ xs: 12, lg: hasLeftColumn ? 8 : 12 }}>
            <StudentStatusViewRightColumn
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

  if (embedded) {
    return body;
  }

  return <PageContainer>{body}</PageContainer>;
}
