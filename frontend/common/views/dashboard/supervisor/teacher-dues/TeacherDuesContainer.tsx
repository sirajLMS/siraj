"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { SnackbarContainer } from "@/frontend/common/components/ui/container/SnackbarContainer";
import {
  type TeacherDuesViewModel,
  useTeacherDuesViewModel,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/useTeacherDuesViewModel";

const lazyViews = createLazyView<TeacherDuesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/supervisor/teacher-dues/teacherDues.mobile").then(m => ({
      default: m.TeacherDuesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/supervisor/teacher-dues/teacherDues.desktop").then(m => ({
      default: m.TeacherDuesDesktopView,
    }))
);

export function TeacherDuesContainer() {
  const viewModel = useTeacherDuesViewModel({});

  return <SnackbarContainer viewModel={viewModel} mobile={lazyViews.mobile} desktop={lazyViews.desktop} />;
}
