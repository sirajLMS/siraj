"use client";

import { styled } from "@mui/material/styles";
import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import {
  ClassAuditViewGridShared,
  type ClassAuditViewGridSlotConfig,
} from "@/frontend/common/views/dashboard/classes/audit/components/__shared__/classAuditViewGridShared";
import { DesktopFilterButton, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { AdminNoteCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/adminNoteCard.desktop";
import { CommunicationLogCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/communicationLogCard.desktop";
import { OnlineMeetingCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/onlineMeetingCard.desktop";

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
  const gridSlots: ClassAuditViewGridSlotConfig = {
    OnlineMeetingCard: OnlineMeetingCardDesktop,
    gridSlots: {
      CommunicationLogCard: CommunicationLogCardDesktop,
      AdminNoteCard: AdminNoteCardDesktop,
    },
  };

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
    </DesktopPageContainer>
  );
}
