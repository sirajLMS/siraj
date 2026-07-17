"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherStudentsViewModel,
  type UseTeacherStudentsViewModelProps,
  useTeacherStudentsViewModel,
} from "@/frontend/common/views/dashboard/teachers/students/useTeacherStudentsViewModel";

export type { TeacherStudentsViewModel };

const lazyViews = createLazyView<TeacherStudentsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/students/teacherStudentsView.mobile").then(m => ({
      default: m.TeacherStudentsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/students/teacherStudentsView.desktop").then(m => ({
      default: m.TeacherStudentsDesktopView,
    }))
);

/**
 * Switcher for the Teacher Students view. Lazily loads the matching tier's
 * view (`teacherStudentsView.mobile.tsx` / `teacherStudentsView.desktop.tsx`)
 * via `ResponsiveViewSwitch`. The ViewModel hook owns the assigned-students
 * `useQuery` and the localized labels; both tier views consume the flat model.
 */
export function TeacherStudentsView(props: Readonly<UseTeacherStudentsViewModelProps> = {}) {
  const viewModel = useTeacherStudentsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
