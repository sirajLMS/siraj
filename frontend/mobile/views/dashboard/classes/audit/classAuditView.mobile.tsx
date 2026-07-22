"use client";

import { Box, Chip, Grid, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ClassAuditDetailsCard } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard";
import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { ClassAuditGrid } from "@/frontend/common/views/dashboard/classes/audit/components/classAuditGrid";
import { buildDetailsLabels } from "@/frontend/common/views/dashboard/classes/audit/utils";
import { MobileFilterButton, MobilePageContainer, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import { AdminNoteCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/adminNoteCard.mobile";
import { CommunicationLogCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/communicationLogCard.mobile";
import { OnlineMeetingCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/onlineMeetingCard.mobile";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

const StyledMobileClassTitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Hanken Grotesk", sans-serif',
  fontSize: theme.typography.headlineMd.fontSize,
  fontWeight: 600,
  color: theme.palette.primary.main,
  lineHeight: 1.2,
}));

const StyledMobileStatusChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  fontFamily: '"Inter", sans-serif',
  fontSize: theme.typography.labelUppercase.fontSize,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
}));

const StyledGenerateReportButton = styled(MobileFilterButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.primary.dark,
  },
}));

export function ClassAuditViewMobile({
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
    <MobilePageContainer>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center", justifyContent: "flex-end" }}>
          <StyledGenerateReportButton id="audit-generate-report-btn" onClick={onGenerateReport}>
            {labels.generateReport}
          </StyledGenerateReportButton>
          <MobilePrimaryPageAction id="audit-edit-class-btn" onClick={onEditClass}>
            {labels.editClass}
          </MobilePrimaryPageAction>
        </Box>
        <StyledMobileClassTitle sx={{ mb: 1 }}>{audit.className}</StyledMobileClassTitle>
        <StyledMobileStatusChip label={labels.statusRescheduled} size="small" />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 1, lg: 1 } }}>
          <ClassAuditDetailsCard audit={audit} labels={detailsLabels} />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 2, lg: 2 } }}>
          <OnlineMeetingCardMobile
            meetingInfo={audit.meetingInfo}
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
            CommunicationLogCard: CommunicationLogCardMobile,
            AdminNoteCard: AdminNoteCardMobile,
          }}
        />
      </Grid>
    </MobilePageContainer>
  );
}
