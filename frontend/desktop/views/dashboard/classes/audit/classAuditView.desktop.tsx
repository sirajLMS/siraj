"use client";

import { Box, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FilterButton, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/common/components/ui";
import { AdminNoteCard } from "@/frontend/common/views/dashboard/classes/audit/AdminNoteCard";
import { ClassAuditDetailsCard } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard";
import { CommunicationLogCard } from "@/frontend/common/views/dashboard/classes/audit/CommunicationLogCard";
import type {
  ClassAuditDetailsLabels,
  ClassAuditViewProps,
} from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { OnlineMeetingCard } from "@/frontend/common/views/dashboard/classes/audit/OnlineMeetingCard";
import { RegisteredStudentsSection } from "@/frontend/common/views/dashboard/classes/audit/RegisteredStudentsSection";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

const StyledGenerateReportButton = styled(FilterButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.primary.dark,
  },
}));

function buildDetailsLabels(labels: ClassAuditViewProps["labels"]): ClassAuditDetailsLabels {
  return {
    courseCode: labels.courseCode,
    teacher: labels.teacher,
    originalDate: labels.originalDate,
    rescheduledDate: labels.rescheduledDate,
    timeSlot: labels.timeSlot,
    venue: labels.venue,
    auditTrailTitle: labels.auditTrailTitle,
    statusRescheduled: labels.statusRescheduled,
    classDetails: labels.classDetails,
  };
}

export function ClassAuditViewDesktop({
  audit,
  labels,
  onGenerateReport,
  onEditClass,
  onExportStudents,
  onViewStudent,
  onResendNotifications,
  onUpdateAdminNote,
  onEditAdminNote,
  isResending,
}: Readonly<ClassAuditViewProps>) {
  const detailsLabels = buildDetailsLabels(labels);

  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        breadcrumbs={[
          { label: labels.breadcrumbs.dashboard, href: "/dashboard" },
          { label: labels.breadcrumbs.schedules, href: "/schedule-search" },
          { label: labels.breadcrumbs.current, current: true },
        ]}
        actions={
          <>
            <StyledGenerateReportButton id="audit-generate-report-btn" onClick={onGenerateReport}>
              {labels.generateReport}
            </StyledGenerateReportButton>
            <PrimaryPageAction id="audit-edit-class-btn" onClick={onEditClass}>
              {labels.editClass}
            </PrimaryPageAction>
          </>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 1, lg: 1 } }}>
          <ClassAuditDetailsCard audit={audit} labels={detailsLabels} />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 2, lg: 2 } }}>
          <OnlineMeetingCard
            meetingInfo={audit.meetingInfo}
            labels={labels.meetingInfo}
            showJoin={isJoinableClassInstance(audit.status, audit.outcome, { isFrozen: audit.isFrozen ?? false })}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 3, lg: 4 } }}>
          <Box sx={{ mt: { lg: 0 } }}>
            <CommunicationLogCard
              entries={audit.communications}
              labels={labels.communicationLog}
              onResend={onResendNotifications}
              isResending={isResending}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 4, lg: 3 } }}>
          <RegisteredStudentsSection
            students={audit.students}
            registeredCount={audit.registeredStudentCount ?? 0}
            labels={labels.registeredStudents}
            onExport={onExportStudents}
            onViewStudent={onViewStudent}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 5, lg: 5 } }}>
          <AdminNoteCard
            note={audit.adminNote}
            labels={labels.adminNote}
            onUpdate={onUpdateAdminNote}
            onEdit={onEditAdminNote}
          />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
