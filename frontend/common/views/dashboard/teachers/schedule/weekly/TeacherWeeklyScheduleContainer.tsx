"use client";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type TeacherWeeklyScheduleViewModel,
  type UseTeacherWeeklyScheduleViewModelProps,
  useTeacherWeeklyScheduleViewModel,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/useTeacherWeeklyScheduleViewModel";

const lazyViews = createLazyView<TeacherWeeklyScheduleViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleView.mobile").then(m => ({
      default: m.TeacherWeeklyScheduleViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleView.desktop").then(m => ({
      default: m.TeacherWeeklyScheduleViewDesktop,
    }))
);

export function TeacherWeeklyScheduleContainer(props: Readonly<UseTeacherWeeklyScheduleViewModelProps>) {
  const viewModel = useTeacherWeeklyScheduleViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewWeekly]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export default TeacherWeeklyScheduleContainer;
export type { TeacherWeeklyScheduleViewModel, UseTeacherWeeklyScheduleViewModelProps };
