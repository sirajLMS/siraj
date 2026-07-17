"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { StudentProfilePageViewModel } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel";

const lazyViews = createLazyView<StudentProfilePageViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/students/profile/studentProfilePage.mobile").then(m => ({
      default: m.StudentProfilePageMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/students/profile/studentProfilePage.desktop").then(m => ({
      default: m.StudentProfilePageDesktopView,
    }))
);

export function StudentProfilePageView(props: Readonly<StudentProfilePageViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { StudentProfilePageViewModel };
