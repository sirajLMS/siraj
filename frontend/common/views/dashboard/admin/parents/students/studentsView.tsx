"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { StudentsViewModel } from "@/frontend/common/views/dashboard/admin/parents/students/useStudentsViewModel";

export type { StudentsViewModel };

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

export function StudentsView(props: Readonly<StudentsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
