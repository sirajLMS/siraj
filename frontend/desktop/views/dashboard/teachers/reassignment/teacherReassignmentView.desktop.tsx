"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert, Box, Grid } from "@mui/material";
import type { TeacherReassignmentViewModel } from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { CurrentTeacherCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/currentTeacherCard.desktop";
import { ManagementControlsCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/managementControlsCard.desktop";
import { ReassignmentBentoGridDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/reassignmentBentoGrid.desktop";
import { StudentContextCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/studentContextCard.desktop";

export function TeacherReassignmentViewDesktop({
  labels,
  student,
  currentTeacherName,
  isSubmitting,
  onReassign,
  onStatusChange,
  onCancel,
  controls,
  bento,
}: Readonly<TeacherReassignmentViewModel>) {
  const breadcrumbs = [
    { label: labels.breadcrumbs.dashboard, href: "/dashboard" },
    { label: labels.breadcrumbs.parentManagement, href: "/teachers" },
    { label: labels.breadcrumbs.teacherReassignment, active: true },
  ];

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} breadcrumbs={breadcrumbs} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <StudentContextCardDesktop student={student} labels={labels.studentContext} />
            <CurrentTeacherCardDesktop
              currentTeacherName={currentTeacherName}
              teacherId={student.primaryTeacherId ?? undefined}
              labels={labels.currentTeacher}
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
              {labels.warning}
            </Alert>

            <ManagementControlsCardDesktop
              currentStatus={student.status}
              studentId={student.id}
              version={student.version}
              isSubmitting={isSubmitting}
              onReassign={onReassign}
              onStatusChange={onStatusChange}
              onCancel={onCancel}
              selectedTeacherId={controls.selectedTeacherId}
              selectedNewStatus={controls.selectedNewStatus}
              saved={controls.saved}
              onSelectedTeacherIdChange={controls.onSelectedTeacherIdChange}
              onSelectedNewStatusChange={controls.onSelectedNewStatusChange}
              onSubmitForm={controls.onSubmitForm}
              labels={{ controls: labels.controls, actions: labels.actions }}
              statusLabelId="teacher-reassignment-status-label-desktop"
            />

            <ReassignmentBentoGridDesktop
              studentId={student.id}
              lastUpdated={student.updatedAt}
              pendingNotificationCount={0}
              onOpenChangeHistory={bento.onOpenChangeHistory}
              onOpenParentContact={bento.onOpenParentContact}
              labels={labels.historyAndContact}
            />
          </Box>
        </Grid>
      </Grid>
    </DesktopPageContainer>
  );
}
