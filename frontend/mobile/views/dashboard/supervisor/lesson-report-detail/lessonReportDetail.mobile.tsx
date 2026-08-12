"use client";

import { LessonReportDetailShared } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/__shared__/lessonReportDetailShared";
import type { LessonReportDetailViewModel } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/useLessonReportDetailViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";
import { LessonReportDetailPanelMobile } from "@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.mobile";

export function LessonReportDetailMobileView({ ...vm }: Readonly<LessonReportDetailViewModel>) {
  return (
    <LessonReportDetailShared
      vm={vm}
      options={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        DetailPanel: LessonReportDetailPanelMobile,
      }}
    />
  );
}
