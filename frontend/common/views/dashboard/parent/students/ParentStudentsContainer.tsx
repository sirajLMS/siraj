"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type ParentStudentsViewModel,
  type UseParentStudentsViewModelProps,
  useParentStudentsViewModel,
} from "@/frontend/common/views/dashboard/parent/students/useParentStudentsViewModel";

export type { ParentStudentsViewModel, UseParentStudentsViewModelProps };

const lazyViews = createLazyView<ParentStudentsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/parent/students/parentStudents.mobile").then(m => ({
      default: m.ParentStudentsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/parent/students/parentStudents.desktop").then(m => ({
      default: m.ParentStudentsDesktopView,
    }))
);

export function ParentStudentsContainer(props: Readonly<UseParentStudentsViewModelProps>) {
  const viewModel = useParentStudentsViewModel(props);
  return (
    <RequirePermission permissions={[AppPermission.ParentViewStudents]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}
