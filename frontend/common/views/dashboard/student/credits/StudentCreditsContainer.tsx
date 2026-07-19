"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type StudentCreditsViewModel,
  useStudentCreditsViewModel,
} from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";

const lazyViews = createLazyView<StudentCreditsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/student/credits/studentCredits.mobile").then(m => ({
      default: m.StudentCreditsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/student/credits/studentCredits.desktop").then(m => ({
      default: m.StudentCreditsDesktopView,
    }))
);

export function StudentCreditsContainer() {
  const viewModel = useStudentCreditsViewModel();
  return (
    <RequirePermission permissions={[AppPermission.StudentViewOwnDashboard]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { StudentCreditsViewModel };
