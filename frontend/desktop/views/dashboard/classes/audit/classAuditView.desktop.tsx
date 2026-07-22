"use client";

import { Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ClassAuditDetailsCard } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard";
import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { ClassAuditGrid } from "@/frontend/common/views/dashboard/classes/audit/components/classAuditGrid";
import { buildDetailsLabels } from "@/frontend/common/views/dashboard/classes/audit/utils";
import { DesktopFilterButton, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { AdminNoteCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/adminNoteCard.desktop";
import { CommunicationLogCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/communicationLogCard.desktop";
import { OnlineMeetingCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/onlineMeetingCard.desktop";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

const StyledGenerateReportButton = styled(DesktopFilterButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.primary.dark,
  },
}));

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
    <DesktopPageContainer>
      <DesktopPageHeader
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
            <DesktopPrimaryPageAction id="audit-edit-class-btn" onClick={onEditClass}>
              {labels.editClass}
            </DesktopPrimaryPageAction>
          </>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 1, lg: 1 } }}>
          <ClassAuditDetailsCard audit={audit} labels={detailsLabels} />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 2, lg: 2 } }}>
          <OnlineMeetingCardDesktop
            meetingInfo={audit.meetingInfo}
            labels={labels.meetingInfo}
            showJoin={isJoinableClassInstance(audit.status, audit.outcome, { isFrozen: audit.isFrozen ?? false })}
          />
        </Grid>

        <ClassAuditGrid
          communications={audit.communications}
          communicationLogLabels={labels.communicationLog}
          onResendNotifications={onResendNotifications}
          isResending={isResending}
          students={audit.students}
          registeredStudentCount={audit.registeredStudentCount ?? 0}
          registeredStudentsLabels={labels.registeredStudents}
          onExportStudents={onExportStudents}
          onViewStudent={onViewStudent}
          adminNote={audit.adminNote}
          adminNoteLabels={labels.adminNote}
          onUpdateAdminNote={onUpdateAdminNote}
          onEditAdminNote={onEditAdminNote}
          slots={{
            CommunicationLogCard: CommunicationLogCardDesktop,
            AdminNoteCard: AdminNoteCardDesktop,
          }}
        />
      </Grid>
    </DesktopPageContainer>
  );
}
