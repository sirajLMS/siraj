"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type StudentsViewModel,
  useStudentsViewModel,
} from "@/frontend/common/views/dashboard/admin/parents/students/useStudentsViewModel";

const lazyViews = createLazyView<StudentsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/parents/students/students.mobile").then(m => ({
      default: m.StudentsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/parents/students/students.desktop").then(m => ({
      default: m.StudentsDesktopView,
    }))
);

export function StudentsContainer() {
  const viewModel = useStudentsViewModel();

  return (
    <RequirePermission permissions={[AppPermission.StudentsList]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { StudentsViewModel };
