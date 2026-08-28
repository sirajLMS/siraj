"use client";

import {
  TeacherLessonReportCardContent,
  type TeacherLessonReportsSectionPanelSlotProps,
  TeacherLessonReportsViewShared,
} from "@/frontend/common/views/dashboard/teachers/lesson-reports/__shared__/teacherLessonReportsViewShared";
import type { TeacherLessonReportsViewModel } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";

function MobileReportsSectionPanel({ actions, children }: Readonly<TeacherLessonReportsSectionPanelSlotProps>) {
  return (
    <MobileSectionPanel contentInset={false} actions={actions}>
      {children}
    </MobileSectionPanel>
  );
}

export function TeacherLessonReportsMobileView(props: Readonly<TeacherLessonReportsViewModel>) {
  const { rows, loading, labelsBySection, locale, resolveStatusLabel } = props;
  const { shell, cards } = labelsBySection;

  return (
    <TeacherLessonReportsViewShared
      {...props}
      slots={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        SectionPanel: MobileReportsSectionPanel,
      }}
    >
      <MobileCardList
        rows={rows}
        loading={loading}
        getKey={row => row.id ?? row.classInstanceId ?? ""}
        emptyMessage={shell.emptyMessage}
        paginationOptions={{ mode: "client" }}
        renderItem={row => (
          <MobileCardListItem variant="edge-to-edge">
            <TeacherLessonReportCardContent
              row={row}
              labels={cards}
              locale={locale}
              resolveStatusLabel={resolveStatusLabel}
            />
          </MobileCardListItem>
        )}
      />
    </TeacherLessonReportsViewShared>
  );
}
