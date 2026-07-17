"use client";

import type { AssociatedStudentsSectionVariantProps } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { AssociatedStudentsDataGridDesktop } from "@/frontend/desktop/views/dashboard/profile/parent/sections/associatedStudentsDataGrid.desktop";
import { useAppTranslation } from "@/shared/locale";

export function AssociatedStudentsSectionDesktopView({
  rows,
  loading,
  emptyMessage,
}: Readonly<AssociatedStudentsSectionVariantProps>) {
  const t = useAppTranslation().profileTranslations.parent;
  return (
    <DesktopSectionPanel title={t.sections.students}>
      <AssociatedStudentsDataGridDesktop rows={rows} loading={loading} emptyMessage={emptyMessage} />
    </DesktopSectionPanel>
  );
}
