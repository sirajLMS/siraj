"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";

const lazyViews = createLazyView<TeacherWeeklyScheduleViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleView.mobile").then(m => ({
      default: m.TeacherWeeklyScheduleViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleView.desktop").then(m => ({
      default: m.TeacherWeeklyScheduleViewDesktop,
    }))
);

export default function TeacherWeeklyScheduleView(props: Readonly<TeacherWeeklyScheduleViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
