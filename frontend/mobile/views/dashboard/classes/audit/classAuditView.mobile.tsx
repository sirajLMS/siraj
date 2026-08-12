"use client";

import { Box, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import {
  ClassAuditViewGridShared,
  type ClassAuditViewGridSlotConfig,
} from "@/frontend/common/views/dashboard/classes/audit/components/__shared__/classAuditViewGridShared";
import { MobileFilterButton, MobilePageContainer, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import { AdminNoteCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/adminNoteCard.mobile";
import { CommunicationLogCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/communicationLogCard.mobile";
import { OnlineMeetingCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/onlineMeetingCard.mobile";

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
  const gridSlots: ClassAuditViewGridSlotConfig = {
    OnlineMeetingCard: OnlineMeetingCardMobile,
    gridSlots: {
      CommunicationLogCard: CommunicationLogCardMobile,
      AdminNoteCard: AdminNoteCardMobile,
    },
  };

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

      <ClassAuditViewGridShared
        audit={audit}
        labels={labels}
        onResendNotifications={onResendNotifications}
        isResending={isResending}
        onExportStudents={onExportStudents}
        onViewStudent={onViewStudent}
        onUpdateAdminNote={onUpdateAdminNote}
        onEditAdminNote={onEditAdminNote}
        slots={gridSlots}
      />
    </MobilePageContainer>
  );
}
