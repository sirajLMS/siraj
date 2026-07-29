"use client";

import type { AssociatedStudentsSectionVariantProps } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { AssociatedStudentsDataGridDesktop } from "@/frontend/desktop/views/dashboard/profile/parent/sections/associatedStudentsDataGrid.desktop";

export function AssociatedStudentsSectionDesktopView({
  labels,
  rows,
  loading,
  emptyMessage,
}: Readonly<AssociatedStudentsSectionVariantProps>) {
  return (
    <DesktopSectionPanel contentPadding={false} title={labels.parent.sections.students}>
      <AssociatedStudentsDataGridDesktop rows={rows} labels={labels} loading={loading} emptyMessage={emptyMessage} />
    </DesktopSectionPanel>
  );
}
