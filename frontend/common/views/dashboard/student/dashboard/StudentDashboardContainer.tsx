"use client";

import { Fragment } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ReflectionDialog } from "@/frontend/common/views/dashboard/student/dashboard/components/ReflectionDialog";
import {
  type StudentDashboardViewModel,
  useStudentDashboardViewModel,
} from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";

const lazyViews = createLazyView<StudentDashboardViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/student/dashboard/studentDashboard.mobile").then(m => ({
      default: m.StudentDashboardMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/student/dashboard/studentDashboard.desktop").then(m => ({
      default: m.StudentDashboardDesktopView,
    }))
);

export function StudentDashboardContainer() {
  const viewModel = useStudentDashboardViewModel({});
  return (
    <RequirePermission permissions={[AppPermission.StudentViewOwnDashboard]} fallback={null}>
      <Fragment>
        <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
        <ReflectionDialog />
      </Fragment>
    </RequirePermission>
  );
}

export type { StudentDashboardViewModel };
