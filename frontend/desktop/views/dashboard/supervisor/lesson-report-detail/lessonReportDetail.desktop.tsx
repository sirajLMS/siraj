"use client";

import { LessonReportDetailShared } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/__shared__/lessonReportDetailShared";
import type { LessonReportDetailViewModel } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/useLessonReportDetailViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { LessonReportDetailPanelDesktop } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.desktop";

export function LessonReportDetailDesktopView({ ...vm }: Readonly<LessonReportDetailViewModel>) {
  return (
    <LessonReportDetailShared
      vm={vm}
      options={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        DetailPanel: LessonReportDetailPanelDesktop,
      }}
    />
  );
}
