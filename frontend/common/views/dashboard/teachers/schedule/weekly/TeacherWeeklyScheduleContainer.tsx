"use client";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CreateRecurringClassDialog } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/components/CreateRecurringClassDialog";
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

  // NEW FOR PLAN v5: `<RequirePermission>` for `ScheduleCreateClass` lifted
  // out of BOTH tier dialog files (specs §6.1 + N3 — permission gating lives
  // in the Container; the tier dialog files now consume `hasSessionCreateClass`
  // as a plain ViewModel-supplied boolean).
  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewWeekly]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
      <RequirePermission permissions={[AppPermission.ScheduleCreateClass]}>
        <CreateRecurringClassDialog
          teacherId={props.teacherId}
          onRefetch={viewModel.handleRefetch}
          viewModel={viewModel.createRecurringClassDialog}
        />
      </RequirePermission>
    </RequirePermission>
  );
}

export default TeacherWeeklyScheduleContainer;
export type { TeacherWeeklyScheduleViewModel, UseTeacherWeeklyScheduleViewModelProps };
