"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { LessonReportDetailViewModel } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/useLessonReportDetailViewModel";
import { useLessonReportDetailViewModel } from "@/frontend/common/views/dashboard/supervisor/lesson-report-detail/useLessonReportDetailViewModel";

const lazyViews = createLazyView<LessonReportDetailViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/supervisor/lesson-report-detail/lessonReportDetail.mobile").then(m => ({
      default: m.LessonReportDetailMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/supervisor/lesson-report-detail/lessonReportDetail.desktop").then(m => ({
      default: m.LessonReportDetailDesktopView,
    }))
);

export function LessonReportDetailContainer() {
  const viewModel = useLessonReportDetailViewModel({});
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
