"use client";

import { styled } from "@mui/material/styles";
import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import {
  ClassAuditViewGridShared,
  type ClassAuditViewGridSlotConfig,
} from "@/frontend/common/views/dashboard/classes/audit/components/__shared__/classAuditViewGridShared";
import {
  MobileContentInset,
  MobileFilterButton,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { AdminNoteCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/adminNoteCard.mobile";
import { CommunicationLogCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/communicationLogCard.mobile";
import { OnlineMeetingCardMobile } from "@/frontend/mobile/views/dashboard/classes/audit/onlineMeetingCard.mobile";

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
      <MobilePageHeader
        title={audit.className ?? ""}
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
            <MobilePrimaryPageAction id="audit-edit-class-btn" onClick={onEditClass}>
              {labels.editClass}
            </MobilePrimaryPageAction>
          </>
        }
      />
      <MobileContentInset sx={{ mb: 2 }}>
        <MobileStatusBadge category="trackingStatus" status="rescheduled" label={labels.statusRescheduled} />
      </MobileContentInset>

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
