"use client";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type TeacherOnboardingViewModel,
  useTeacherOnboardingViewModel,
} from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";

const lazyViews = createLazyView<TeacherOnboardingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/onboarding/teacherOnboardingView.mobile").then(m => ({
      default: m.TeacherOnboardingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/onboarding/teacherOnboardingView.desktop").then(m => ({
      default: m.TeacherOnboardingDesktopView,
    }))
);

export function TeacherOnboardingContainer() {
  const viewModel = useTeacherOnboardingViewModel();

  return (
    <RequirePermission permissions={[AppPermission.TeachersCreate]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { TeacherOnboardingViewModel };
