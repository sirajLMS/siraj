"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { TeacherLessonReportsViewModel } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";

const lazyViews = createLazyView<TeacherLessonReportsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/lesson-reports/teacherLessonReportsView.mobile").then(m => ({
      default: m.TeacherLessonReportsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/lesson-reports/teacherLessonReportsView.desktop").then(m => ({
      default: m.TeacherLessonReportsDesktopView,
    }))
);

export function TeacherLessonReportsView(props: Readonly<TeacherLessonReportsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { TeacherLessonReportsViewModel };
