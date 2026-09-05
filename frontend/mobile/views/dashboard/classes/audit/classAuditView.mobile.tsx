"use client";

import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { ClassAuditHeaderShared } from "@/frontend/common/views/dashboard/classes/audit/components/__shared__/classAuditHeaderShared";
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
  payroll,
  statusEvents,
  onOverride,
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
      <ClassAuditHeaderShared
        title={audit.className ?? ""}
        labels={labels}
        onGenerateReport={onGenerateReport}
        onEditClass={onEditClass}
        slots={{
          PageHeader: MobilePageHeader,
          FilterButton: MobileFilterButton,
          PrimaryAction: MobilePrimaryPageAction,
        }}
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
        payroll={payroll}
        statusEvents={statusEvents}
        onOverride={onOverride}
        slots={gridSlots}
      />
    </MobilePageContainer>
  );
}
