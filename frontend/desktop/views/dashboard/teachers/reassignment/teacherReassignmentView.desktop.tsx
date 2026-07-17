"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert, Box, Grid } from "@mui/material";
import type { TeacherReassignmentViewModel } from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";
import { CurrentTeacherCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/currentTeacherCard.desktop";
import { ManagementControlsCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/managementControlsCard.desktop";
import { ReassignmentBentoGridDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/reassignmentBentoGrid.desktop";
import { StudentContextCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/studentContextCard.desktop";
import { useAppTranslation } from "@/shared/locale";

export function TeacherReassignmentViewDesktop({
  student,
  currentTeacherName,
  teachers,
  isSubmitting,
  onReassign,
  onStatusChange,
  onCancel,
}: Readonly<TeacherReassignmentViewModel>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment;

  const breadcrumbs = [
    { label: t.breadcrumbs.dashboard, href: "/dashboard" },
    { label: t.breadcrumbs.parentManagement, href: "/teachers" },
    { label: t.breadcrumbs.teacherReassignment, active: true },
  ];

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={t.pageTitle} subtitle={t.pageSubtitle} breadcrumbs={breadcrumbs} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <StudentContextCardDesktop student={student} />
            <CurrentTeacherCardDesktop
              currentTeacherName={currentTeacherName}
              teacherId={student.primaryTeacherId ?? undefined}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Alert
              severity="error"
              icon={<WarningOutlined />}
              sx={theme => ({
                backgroundColor: theme.palette.errorContainer,
                color: theme.palette.onErrorContainer,
                borderRadius: 2,
                "& .MuiAlert-icon": {
                  color: theme.palette.error.main,
                },
                fontWeight: 700,
              })}
            >
              {t.warning}
            </Alert>

            <ManagementControlsCardDesktop
              teachers={teachers}
              currentStatus={student.status}
              studentId={student.id}
              version={student.version}
              isSubmitting={isSubmitting}
              onReassign={onReassign}
              onStatusChange={onStatusChange}
              onCancel={onCancel}
            />

            <ReassignmentBentoGridDesktop
              studentId={student.id}
              lastUpdated={student.updatedAt}
              pendingNotificationCount={0}
            />
          </Box>
        </Grid>
      </Grid>
    </DesktopPageContainer>
  );
}
