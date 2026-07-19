"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type StudentHistoryViewModel,
  useStudentHistoryViewModel,
} from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";

const lazyViews = createLazyView<StudentHistoryViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/student/history/studentHistory.mobile").then(m => ({
      default: m.StudentHistoryMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/student/history/studentHistory.desktop").then(m => ({
      default: m.StudentHistoryDesktopView,
    }))
);

export function StudentHistoryView() {
  const viewModel = useStudentHistoryViewModel({});
  return (
    <RequirePermission permissions={[AppPermission.StudentViewOwnDashboard]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { StudentHistoryViewModel };
