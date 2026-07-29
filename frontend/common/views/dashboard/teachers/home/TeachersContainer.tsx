"use client";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type TeachersViewModel,
  type UseTeachersViewModelProps,
  useTeachersViewModel,
} from "@/frontend/common/views/dashboard/teachers/home/useTeachersViewModel";

const lazyViews = createLazyView<TeachersViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/home/teachersView.mobile").then(m => ({
      default: m.TeachersMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/home/teachersView.desktop").then(m => ({
      default: m.TeachersDesktopView,
    }))
);

export function TeachersContainer(props: Readonly<UseTeachersViewModelProps> = {}) {
  const viewModel = useTeachersViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.StaffViewDirectory, AppPermission.TeachersList]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { TeachersViewModel, UseTeachersViewModelProps };
