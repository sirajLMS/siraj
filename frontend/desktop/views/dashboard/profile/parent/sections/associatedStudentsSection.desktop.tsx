"use client";

import { SectionPanel } from "@/frontend/common/components/ui";
import type { AssociatedStudentsSectionVariantProps } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { AssociatedStudentsDataGridDesktop } from "@/frontend/desktop/views/dashboard/profile/parent/sections/associatedStudentsDataGrid.desktop";
import { useAppTranslation } from "@/shared/locale";

export function AssociatedStudentsSectionDesktopView({
  rows,
  loading,
  emptyMessage,
}: Readonly<AssociatedStudentsSectionVariantProps>) {
  const t = useAppTranslation().profileTranslations.parent;
  return (
    <SectionPanel title={t.sections.students} edgeToEdge>
      <AssociatedStudentsDataGridDesktop rows={rows} loading={loading} emptyMessage={emptyMessage} />
    </SectionPanel>
  );
}
