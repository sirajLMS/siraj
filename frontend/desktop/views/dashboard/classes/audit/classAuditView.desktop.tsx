"use client";

import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { ClassAuditHeaderShared } from "@/frontend/common/views/dashboard/classes/audit/components/__shared__/classAuditHeaderShared";
import {
  ClassAuditViewGridShared,
  type ClassAuditViewGridSlotConfig,
} from "@/frontend/common/views/dashboard/classes/audit/components/__shared__/classAuditViewGridShared";
import { DesktopFilterButton, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { AdminNoteCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/adminNoteCard.desktop";
import { CommunicationLogCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/communicationLogCard.desktop";
import { OnlineMeetingCardDesktop } from "@/frontend/desktop/views/dashboard/classes/audit/onlineMeetingCard.desktop";

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
      <ClassAuditHeaderShared
        title={labels.pageTitle}
        labels={labels}
        onGenerateReport={onGenerateReport}
        onEditClass={onEditClass}
        slots={{
          PageHeader: DesktopPageHeader,
          FilterButton: DesktopFilterButton,
          PrimaryAction: DesktopPrimaryPageAction,
        }}
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
