"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentCreditHoursViewModel,
  useStudentCreditHoursViewModel,
} from "@/frontend/common/views/dashboard/students/profile/useStudentCreditHoursViewModel";

// createLazyView must run at module top level with static import paths so
// next/dynamic can split each tier into its own chunk.
const lazyViews = createLazyView<StudentCreditHoursViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/students/profile/studentCreditHours.mobile").then(m => ({
      default: m.StudentCreditHoursMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/students/profile/studentCreditHours.desktop").then(m => ({
      default: m.StudentCreditHoursDesktopView,
    }))
);

/**
 * Student profile credit-hours tab. Switcher only: business logic lives in
 * `useStudentCreditHoursViewModel`, presentation in the tier views.
 */
export function StudentCreditHoursTab({ studentId }: Readonly<{ studentId: string }>) {
  const viewModel = useStudentCreditHoursViewModel({ studentId });
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
