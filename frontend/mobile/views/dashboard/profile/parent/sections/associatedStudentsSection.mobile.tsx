"use client";

import type { AssociatedStudentsSectionVariantProps } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui";
import { AssociatedStudentsCardListMobile } from "@/frontend/mobile/views/dashboard/profile/parent/sections/associatedStudentsCardList.mobile";

export function AssociatedStudentsSectionMobileView({
  labels,
  rows,
  loading,
  emptyMessage,
}: Readonly<AssociatedStudentsSectionVariantProps>) {
  return (
    <MobileSectionPanel title={labels.parent.sections.students} edgeToEdge contentInset={false}>
      <AssociatedStudentsCardListMobile rows={rows} labels={labels} loading={loading} emptyMessage={emptyMessage} />
    </MobileSectionPanel>
  );
}
